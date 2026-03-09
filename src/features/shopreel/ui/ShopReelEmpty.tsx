export default function ShopReelEmpty(props: { message: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/10 bg-black/25 px-5 py-6 text-sm text-white/58">
      {props.message}
    </div>
  );
}
