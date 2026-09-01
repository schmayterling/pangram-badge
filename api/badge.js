const PANGRAM_HOSTS = new Set(["pangram.com", "www.pangram.com"]);
const HISTORY_PATH = /^\/history\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i;

export function parsePangramUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("paste a valid pangram history link");
  }

  const match = url.pathname.match(HISTORY_PATH);
  if (url.protocol !== "https:" || !PANGRAM_HOSTS.has(url.hostname) || !match) {
    throw new Error("use a public pangram.com/history link");
  }

  return {
    id: match[1],
    sourceUrl: `https://www.pangram.com/history/${match[1]}`,
  };
}

export function parsePangramResult(result) {
  const overall = result?.response?.overall ?? result?.response_payload;
  const kind = overall?.prediction_short?.toLowerCase();
  const fractionKeys = {
    ai: "fraction_ai",
    human: "fraction_human",
    mixed: "fraction_mixed",
    "ai-assisted": "fraction_ai_assisted",
  };
  const fraction = Number(overall?.[fractionKeys[kind]]);

  if (!fractionKeys[kind] || !Number.isFinite(fraction)) {
    throw new Error("pangram verdict could not be read");
  }

  const breakdown = overall?.fraction_breakdown?.[kind] ?? {};
  const confidence = Object.entries(breakdown)
    .filter(([name, value]) => name.endsWith("-confidence") && Number(value) > 0)
    .sort((left, right) => Number(right[1]) - Number(left[1]))[0]?.[0]
    ?.replace("-confidence", "")
    ?? overall?.windows?.find((window) => window.confidence)?.confidence?.toLowerCase();

  if (!confidence) throw new Error("pangram confidence could not be read");

  const percentage = Math.round(fraction * 1000) / 10;
  return {
    kind,
    percentage,
    confidence,
    label: `${percentage}% ${kind}`,
  };
}

function escapeXml(value) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

export function makeBadge({ label, kind, confidence }) {
  const safeLabel = escapeXml(label);
  const safeRawConfidence = escapeXml(confidence);
  const safeConfidence = escapeXml(`${confidence} conf.`);
  const colors = {
    human: "#16834f",
    ai: "#d94a12",
    mixed: "#b56a00",
    "ai-assisted": "#6e54b5",
  };
  const color = colors[kind] ?? "#555";
  const valueWidth = Math.max(58, Math.ceil(label.length * 6.1 + 14));
  const confidenceWidth = Math.max(62, Math.ceil(safeConfidence.length * 5.6 + 14));
  const sourceWidth = 80;
  const width = sourceWidth + valueWidth + confidenceWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="24" role="img" aria-label="pangram: ${safeLabel}, ${safeConfidence}" data-verdict="${safeLabel}" data-confidence="${safeRawConfidence}">
  <title>pangram: ${safeLabel}, ${safeConfidence}</title>
  <clipPath id="r"><rect width="${width}" height="24" rx="5"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${sourceWidth}" height="24" fill="#202020"/>
    <rect x="${sourceWidth}" width="${valueWidth}" height="24" fill="${color}"/>
    <rect x="${sourceWidth + valueWidth}" width="${confidenceWidth}" height="24" fill="${color}"/>
    <rect x="${sourceWidth + valueWidth}" width="1" height="24" fill="#fff" opacity=".28"/>
  </g>
  <svg x="7" y="5.5" width="13" height="13" viewBox="116 116 488 488" aria-hidden="true">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M359.983 575.114V575.131L165.343 385.77V144.852L359.983 575.114Z" fill="#FECAB9"/>
    <path d="M554.623 144.852V385.77L360.034 575.098L360 575.114L359.983 575.131V575.114L360 575.081L554.623 144.852Z" fill="#FECAB9"/>
    <path d="M554.657 144.852L360 575.081L359.983 575.114L165.343 144.852L360 256.258L554.657 144.852Z" fill="#FF6106"/>
  </svg>
  <g fill="#fff" text-anchor="middle" font-family="ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="10.5" font-weight="650">
    <text x="49" y="15.5">pangram</text>
    <text x="${sourceWidth + valueWidth / 2}" y="15.5">${safeLabel}</text>
    <text x="${sourceWidth + valueWidth + confidenceWidth / 2}" y="15.5" font-size="9.5">${safeConfidence}</text>
  </g>
</svg>`;
}

export default async function handler(request, response) {
  try {
    const { sourceUrl } = parsePangramUrl(request.query?.url);
    const id = sourceUrl.split("/").at(-1);
    const upstream = await fetch(`https://web.pangram.com/api/history/${id}/`, {
      headers: { "user-agent": "pangram-badge/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) throw new Error("pangram result is unavailable");

    const verdict = parsePangramResult(await upstream.json());
    response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.setHeader("CDN-Cache-Control", "no-store");
    response.setHeader("Vercel-CDN-Cache-Control", "no-store");
    response.setHeader("X-Pangram-Verdict", verdict.label);
    response.setHeader("X-Pangram-Confidence", verdict.confidence);
    response.status(200).send(makeBadge(verdict));
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
}
