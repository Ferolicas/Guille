import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand ${inverse ? "brand-inverse" : ""}`} href="/" aria-label="Guillo Guambi, inicio">
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <path d="M7 22C7 13.72 13.72 7 22 7c4.17 0 7.95 1.7 10.67 4.44l-4.24 4.25A8.97 8.97 0 0 0 22 13a9 9 0 1 0 7.74 13.58H22v-6h15v3C37 31.28 30.28 37 22 37S7 30.28 7 22Z" />
        <path className="brand-cut" d="M34 7h4v30h-4z" />
      </svg>
      <span><strong>GUILLO</strong><small>GUAMBI · REFORMAS</small></span>
    </Link>
  );
}
