export default function ShopReelEmpty(props: { message: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(193,102,59,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] px-5 py-6 text-sm text-white/62 backdrop-blur-xl">
      {props.message}
    </div>
  );
}
