#!/usr/bin/env python3
"""Convert LaTeX paper sections to Markdown for the website.

Handles: math, cross-refs, citations, theorem envs, figures, proofs.
"""
import re
import sys
from pathlib import Path

try:
    import pypandoc
except ImportError:
    print("  pypandoc not installed — run: pip install pypandoc_binary")
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
SECTIONS_DIR = REPO_ROOT / "docs" / "paper" / "sections"
FIGURES_DIR = REPO_ROOT / "docs" / "paper" / "figures"
OUTPUT_DIR = REPO_ROOT / "website" / "paper"
OUTPUT_FIG_DIR = OUTPUT_DIR / "figures"

SECTION_MAP = [
    ("00-abstract", "abstract"),
    ("01-introduction", "introduction"),
    ("02-background", "background"),
    ("03-model", "model"),
    ("03b-pricing", "pricing"),
    ("03c-offchain", "offchain"),
    ("04-throughput", "throughput"),
    ("05-protocol", "protocol"),
    ("06-security", "security"),
    ("06b-verification", "verification"),
    ("07-evaluation", "evaluation"),
    ("08-discussion", "discussion"),
    ("09-conclusion", "conclusion"),
]

# Section labels → readable names for cross-references
SECTION_LABELS = {
    "sec:intro": "Introduction",
    "sec:background": "Background",
    "sec:model": "Formal Model",
    "sec:throughput": "Throughput Optimality",
    "sec:protocol": "Protocol Design",
    "sec:pricing": "Dynamic Pricing",
    "sec:offchain": "Off-Chain Attestation",
    "sec:security": "Security Analysis",
    "sec:verification": "Capacity Verification",
    "sec:divergence": "Statistical Divergence Detection",
    "sec:future-verification": "Future Verification Hardening",
    "sec:evaluation": "Evaluation",
    "sec:discussion": "Discussion",
    "sec:conclusion": "Conclusion",
}

# Section labels → relative links
SECTION_LINKS = {
    "sec:intro": "introduction.md",
    "sec:background": "background.md",
    "sec:model": "model.md",
    "sec:throughput": "throughput.md",
    "sec:protocol": "protocol.md",
    "sec:pricing": "pricing.md",
    "sec:offchain": "offchain.md",
    "sec:security": "security.md",
    "sec:verification": "verification.md",
    "sec:divergence": "verification.md",
    "sec:future-verification": "verification.md",
    "sec:evaluation": "evaluation.md",
    "sec:discussion": "discussion.md",
    "sec:conclusion": "conclusion.md",
}

# Theorem/definition labels → readable text
THEOREM_LABELS = {
    "thm:main": "Theorem (Throughput Optimality)",
    "thm:buffer": "Theorem (Overflow Buffer Bound)",
    "def:network": "Definition (Payment Flow Network)",
    "def:ewma": "Definition (EWMA Smoothing)",
    "def:queue": "Definition (Virtual Queue)",
    "def:maxweight": "Definition (Max-Weight Routing)",
    "def:overflow": "Definition (Overflow Buffer)",
    "def:price": "Definition (Queue-Length Price)",
    "def:completion-receipt": "Definition (CompletionReceipt)",
    "def:underperform": "Definition (Under-performance)",
    "prop:price-eq": "Proposition (Price Equilibrium)",
    "prop:routing": "Proposition (Routing Equivalence)",
    "prop:offchain-security": "Proposition (Off-Chain Security)",
    "prop:bne": "Proposition (Truthful BNE)",
    "prop:detection-latency": "Proposition (Detection Latency)",
}

# Equation labels → readable text
EQ_LABELS = {
    "eq:ewma": "Eq. (EWMA)",
    "eq:queue": "Eq. (Queue Dynamics)",
    "eq:maxweight": "Eq. (Max-Weight)",
    "eq:overflow": "Eq. (Overflow)",
    "eq:price": "Eq. (Price)",
    "eq:basefee": "Eq. (Base Fee)",
    "eq:completion-rate": "Eq. (Completion Rate)",
    "eq:detection-time": "Eq. (Detection Time)",
    "eq:slash-amount": "Eq. (Slash Amount)",
    "eq:payoff": "Eq. (Payoff)",
    "eq:bne-condition": "Eq. (BNE Condition)",
    "eq:capacity-cap": "Eq. (Capacity Cap)",
}

# Citation keys → short readable references
CITATIONS = {
    "tassiulas1992stability": "Tassiulas & Ephremides, 1992",
    "kelly1998rate": "Kelly et al., 1998",
    "neely2010stochastic": "Neely, 2010",
    "srikant2004mathematics": "Srikant, 2004",
    "jacobson1988congestion": "Jacobson, 1988",
    "zhang2020token": "Zhang & Zargham, 2020",
    "superfluid2024": "Superfluid, 2024",
    "gesell1916natural": "Gesell, 1916",
    "fisher1933stamp": "Fisher, 1933",
    "google2025ap2": "Google, 2025",
    "coinbase2025x402": "Coinbase, 2025",
    "openai2025acp": "OpenAI & Stripe, 2025",
    "visa2025tap": "Visa, 2025",
    "cha2025stp": "Cha et al., 2025",
    "adams2021uniswap": "Adams et al., 2021",
    "meyn2009markov": "Meyn & Tweedie, 2009",
    "georgiadis2006resource": "Georgiadis et al., 2006",
    "roughgarden2021eip1559": "Roughgarden, 2021",
    "eip712": "EIP-712",
    "kang2022zkml": "Kang et al., 2022",
}

# Custom LaTeX macros → MathJax definitions (hidden block prepended to each page)
MACRO_DEFS = r"""
<div style="display:none">
$$
\newcommand{\R}{\mathbb{R}}
\newcommand{\N}{\mathbb{N}}
\newcommand{\E}{\mathbb{E}}
\newcommand{\Csmooth}{\bar{C}}
\newcommand{\Craw}{C}
\newcommand{\tasktype}{\tau}
\newcommand{\bps}{\mathrm{BPS}}
$$
</div>

"""


def convert_figures():
    """Convert PDF figures to PNG using PyMuPDF."""
    OUTPUT_FIG_DIR.mkdir(parents=True, exist_ok=True)
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("  pymupdf not installed — run: pip install pymupdf")
        print("  figures will not be converted to PNG")
        return

    for pdf_file in sorted(FIGURES_DIR.glob("*.pdf")):
        png_file = OUTPUT_FIG_DIR / f"{pdf_file.stem}.png"
        try:
            doc = fitz.open(str(pdf_file))
            page = doc[0]
            pix = page.get_pixmap(dpi=200)
            pix.save(str(png_file))
            doc.close()
            print(f"  figure {pdf_file.name} → {png_file.name} ({pix.width}x{pix.height})")
        except Exception as e:
            print(f"  WARN: failed to convert {pdf_file.name}: {e}")


def postprocess(md: str) -> str:
    """Clean up pandoc output for MkDocs Material + MathJax."""

    # ── 1. Fix math delimiters ──

    # Convert ```math fenced blocks → $$ blocks
    md = re.sub(r"```\s*math\s*\n", r"$$\n", md)

    # Close math blocks: ``` after a $$ open → $$
    lines = md.split("\n")
    result = []
    in_math = False
    for line in lines:
        if line.strip() == "$$":
            in_math = not in_math
            result.append(line)
        elif line.strip() == "```" and in_math:
            result.append("$$")
            in_math = False
        else:
            result.append(line)
    md = "\n".join(result)

    # Convert backtick-wrapped inline math $`...`$ → $...$
    md = re.sub(r"\$`([^`]*?)`\$", r"$\1$", md)

    # Convert <span class="math inline">...</span> → $...$
    md = re.sub(
        r'<span class="math inline">(.*?)</span>',
        lambda m: "$" + re.sub(r"</?em>", "", m.group(1)) + "$",
        md,
    )

    # Convert <span class="math display">...</span> → $$...$$
    md = re.sub(
        r'<span class="math display">(.*?)</span>',
        lambda m: "\n$$\n" + re.sub(r"</?em>", "", m.group(1)) + "\n$$\n",
        md,
        flags=re.DOTALL,
    )

    # ── 2. Fix cross-references ──

    # HTML <a> cross-references from \Cref/\cref
    def replace_cref_html(m):
        label = m.group(1)
        name = SECTION_LABELS.get(label, THEOREM_LABELS.get(label, EQ_LABELS.get(label, label)))
        link = SECTION_LINKS.get(label)
        if link:
            return f"[{name}]({link})"
        return f"**{name}**"

    md = re.sub(
        r'<a\s+href="#([^"]*?)"\s+data-reference-type="[^"]*?"\s+data-reference="[^"]*?">\[?[^\]<]*?\]?</a>',
        replace_cref_html,
        md,
    )

    # Remaining \Cref{...} / \cref{...} macros
    md = re.sub(r"\\[Cc]ref\{([^}]*)\}", lambda m: replace_cref_html(m), md)

    # Plain-text label references like "eq:queue" or "thm:main" without markup
    for label, name in {**EQ_LABELS, **THEOREM_LABELS}.items():
        md = md.replace(f" {label}", f" **{name}**")

    # <span id="..." label="..."></span> theorem labels → admonition-style blocks
    md = re.sub(
        r'<span id="([^"]*)" label="[^"]*"></span>\s*',
        lambda m: _theorem_header(m.group(1)),
        md,
    )

    # ── 3. Fix figures ──

    # <figure> with <embed src="figures/X.pdf"> → Markdown image with PNG
    # <figure> with <pre><code> → fenced code block with caption
    def replace_figure(m):
        inner = m.group(1)
        # Extract the PDF filename if present
        src_match = re.search(r'src="figures/([^"]+\.pdf)"', inner)
        caption_match = re.search(r"<figcaption>(.*?)</figcaption>", inner, re.DOTALL)
        caption = ""
        if caption_match:
            cap = caption_match.group(1).strip()
            cap = re.sub(r"<[^>]+>", "", cap)  # strip HTML tags
            caption = cap

        if src_match:
            # Image figure
            pdf_name = src_match.group(1)
            png_name = pdf_name.replace(".pdf", ".png")
            img_md = f"![{caption}](figures/{png_name})"
            if caption:
                img_md += f"\n\n*{caption}*"
            return f"\n{img_md}\n"

        # Text/code figure (e.g., architecture diagrams)
        code_match = re.search(r"<pre><code>(.*?)</code></pre>", inner, re.DOTALL)
        if code_match:
            code = code_match.group(1).strip()
            # Unescape HTML entities
            code = code.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
            result = f"\n```\n{code}\n```\n"
            if caption:
                result += f"\n*{caption}*\n"
            return result

        return m.group(0)

    md = re.sub(r"<figure[^>]*>(.*?)</figure>", replace_figure, md, flags=re.DOTALL)

    # Also catch standalone <embed> tags outside <figure>
    md = re.sub(
        r'<embed src="figures/([^"]+)\.pdf"\s*/?>',
        lambda m: f"![{m.group(1)}](figures/{m.group(1)}.png)",
        md,
    )

    # ── 4. Fix environments ──

    # Remove <div class="definition/theorem/etc"> wrappers, keep content
    md = re.sub(
        r'<div class="(?:definition|theorem|lemma|proposition|corollary|remark)">\s*\n?',
        "",
        md,
    )

    # Convert <div class="proof"> → admonition
    md = re.sub(r'<div class="proof">\s*\n?', '\n!!! abstract "Proof"\n', md)

    # Remove </div> tags
    md = re.sub(r"\n?\s*</div>", "", md)

    # Convert *Proof sketch.* → bold in proof admonitions
    md = md.replace("*Proof sketch.*", "**Proof sketch.**")

    # Fix proof QED symbol
    md = md.replace(" ◻", "\n    $\\square$")

    # ── 5. Fix citations ──

    # pandoc drops \cite{} → empty parens or bare text. The citations show up as
    # trailing spaces where the cite was. We can't perfectly recover them, but we
    # can inject them if the .tex source is available - we process the raw tex below.

    # Clean up empty citation brackets/parens
    md = re.sub(r"\s*\(\s*\)", "", md)

    # Fix HTML entities that pandoc sometimes emits
    md = md.replace("&lt;", "<")
    md = md.replace("&gt;", ">")

    # Fix the <!--> comment artifacts pandoc generates for ~
    md = re.sub(r"<!-- -->", "", md)

    # ── 6. Clean up whitespace ──

    # Collapse 3+ blank lines to 2
    md = re.sub(r"\n{3,}", "\n\n", md)

    return md


def _theorem_header(label: str) -> str:
    """Convert a theorem label to an admonition header."""
    name = THEOREM_LABELS.get(label, label)
    return f'\n!!! info "{name}"\n'


def inject_citations(tex_content: str, md_content: str) -> str:
    """Inject citation text by matching positions from the original LaTeX."""
    # Find all \cite{key} in tex and build replacement text
    for m in re.finditer(r"\\cite\{([^}]+)\}", tex_content):
        keys = [k.strip() for k in m.group(1).split(",")]
        refs = [CITATIONS.get(k, k) for k in keys]
        cite_text = "; ".join(refs)
        # We can't perfectly align positions, but we can replace dangling
        # spaces at sentence-like positions. Instead, do a simpler approach:
        # the pandoc output often has "word " (trailing space) where a citation
        # was. This is imperfect, so we just append a footnote-style reference.

    # Better approach: pre-process the LaTeX to replace \cite{} with readable text
    # before feeding to pandoc. We do this in the main conversion function.
    return md_content


def preprocess_tex(tex_content: str) -> str:
    """Pre-process LaTeX before pandoc conversion to handle citations etc."""
    # Replace \cite{key1,key2} → (Author, Year; Author, Year)
    def expand_cite(m):
        keys = [k.strip() for k in m.group(1).split(",")]
        refs = [CITATIONS.get(k, k) for k in keys]
        return "(" + "; ".join(refs) + ")"

    tex_content = re.sub(r"\\cite\{([^}]+)\}", expand_cite, tex_content)

    # Replace \Cref/\cref with text before pandoc (more reliable)
    for label, name in {**SECTION_LABELS, **THEOREM_LABELS, **EQ_LABELS}.items():
        tex_content = tex_content.replace(f"\\Cref{{{label}}}", name)
        tex_content = tex_content.replace(f"\\cref{{{label}}}", name)

    # Replace \ref{} for theorem/eq labels
    for label, name in {**THEOREM_LABELS, **EQ_LABELS}.items():
        tex_content = tex_content.replace(f"\\ref{{{label}}}", name)

    return tex_content


OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Convert PDF figures to PNG first
convert_figures()

for src_name, dst_name in SECTION_MAP:
    tex_file = SECTIONS_DIR / f"{src_name}.tex"
    md_file = OUTPUT_DIR / f"{dst_name}.md"

    if not tex_file.exists():
        print(f"  skip {src_name}.tex (not found)")
        continue

    try:
        # Pre-process LaTeX: expand citations, cross-refs before pandoc sees them
        tex_content = tex_file.read_text(encoding="utf-8")
        tex_processed = preprocess_tex(tex_content)

        md_content = pypandoc.convert_text(
            tex_processed,
            "gfm+tex_math_dollars",
            format="latex",
            extra_args=["--wrap=none", "--shift-heading-level-by=0"],
        )

        # Post-process pandoc output
        md_content = postprocess(md_content)

        # Prepend hidden MathJax macro definitions for custom commands
        md_content = MACRO_DEFS + md_content

        md_file.write_text(md_content, encoding="utf-8")
        print(f"  converted {src_name}.tex → {dst_name}.md")
    except Exception as e:
        print(f"  WARN: failed to convert {src_name}.tex: {e}")
        if not md_file.exists():
            title = dst_name.capitalize()
            md_file.write_text(
                f"# {title}\n\n"
                f"!!! note\n"
                f"    This section is available in the LaTeX source at "
                f"`docs/paper/sections/{src_name}.tex`.\n",
                encoding="utf-8",
            )

print("  done")
