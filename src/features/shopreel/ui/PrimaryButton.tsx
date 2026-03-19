export default function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="
        px-5 py-2.5 rounded-xl
        bg-[color:var(--pfq-copper)]
        text-black font-medium
        hover:brightness-110
        active:scale-[0.98]
        transition
        shadow-[0_0_20px_rgba(184,115,51,0.25)]
      "
    />
  );
}
