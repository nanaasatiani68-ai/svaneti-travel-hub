export const metadata = {
  title: "Delete Account | Georgia Gateway Hub",
  description: "Request deletion of your Georgia Gateway Hub account and personal data",
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-200">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold text-white">
          Account and Data Deletion
        </h1>

        <p className="mb-6">
          Georgia Gateway Hub users may request deletion of their account
          and associated personal data.
        </p>

        <h2 className="mb-3 mt-8 text-2xl font-semibold text-white">
          How to request deletion
        </h2>

        <p className="mb-4">
          To request deletion of your Georgia Gateway Hub account, send an
          email from the email address associated with your account to:
        </p>

        <p className="mb-6 text-lg font-semibold text-white">
          mestiatravelhub@gmail.com
        </p>

        <p className="mb-6">
          Use the subject line "Delete My Account" and include the email
          address associated with your Georgia Gateway Hub account.
        </p>

        <h2 className="mb-3 mt-8 text-2xl font-semibold text-white">
          What will be deleted
        </h2>

        <p className="mb-6">
          After your request is verified, your account and personal
          information associated with the account will be deleted, except
          for information that we are required to retain for legal,
          security, fraud-prevention, or accounting purposes.
        </p>

        <h2 className="mb-3 mt-8 text-2xl font-semibold text-white">
          Processing time
        </h2>

        <p className="mb-6">
          Account deletion requests will normally be processed within
          30 days after verification of the request.
        </p>

        <p className="mt-12 text-sm text-slate-400">
          Georgia Gateway Hub — georgiagatewayhub.com
        </p>
      </div>
    </main>
  );
}