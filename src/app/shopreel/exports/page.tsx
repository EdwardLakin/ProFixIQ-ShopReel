import Link from "next/link";

export default function ShopReelExportsPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 text-white">
      <h1 className="text-2xl font-semibold">Exports</h1>
      <p className="mt-3 text-sm text-white/75">
        Manual export is the MVP default. Rendered packages (MP4 + thumbnail + captions) are downloaded here and
        uploaded to social platforms by the user.
      </p>
      <div className="mt-6 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm text-white/85">
        Existing publishing tools remain available under advanced or legacy navigation.
        <div className="mt-3">
          <Link href="/shopreel/publish-center" className="underline underline-offset-2">
            Open Publish Center
          </Link>
        </div>
      </div>
    </section>
  );
}
