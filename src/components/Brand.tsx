import Image from "next/image";
import Link from "next/link";

export function Brand({ inverse = false, priority = false }: { inverse?: boolean; priority?: boolean }) {
  return (
    <Link className={`brand ${inverse ? "brand-inverse" : ""}`} href="/" aria-label="Guillo Guambi, inicio">
      <Image className="brand-logo" src="/images/brand/logo-guillo.png" alt="Guillo Guambi · Decoración, pintura y reformas en general" width={720} height={425} priority={priority} />
    </Link>
  );
}
