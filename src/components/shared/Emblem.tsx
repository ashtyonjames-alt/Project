import Image from "next/image";

interface EmblemProps {
  size?: number;
  className?: string;
}

export default function Emblem({ size = 48, className = "" }: EmblemProps) {
  return (
    <Image
      src="/images/emblem.svg"
      alt="Slavakian Union Coat of Arms"
      width={size}
      height={Math.round(size * 1.2)}
      className={className}
      priority
    />
  );
}
