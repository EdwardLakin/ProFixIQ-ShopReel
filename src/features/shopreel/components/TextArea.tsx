export default function TextArea(props: any) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl px-4 py-3 bg-white/[0.03] border border-white/10 focus:border-[#c1663b] focus:ring-2 focus:ring-[#c1663b]/30 outline-none transition"
    />
  )
}
