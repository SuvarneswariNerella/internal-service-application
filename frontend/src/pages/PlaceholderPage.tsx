import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <PageWrapper>
      <PageHeader title={title} description={`${title} management coming soon.`} />
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500">This module is under development.</p>
      </div>
    </PageWrapper>
  );
}
