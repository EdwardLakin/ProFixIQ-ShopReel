export default function ShopReelEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm text-white/60">
      {message}
    </div>
  );
}
