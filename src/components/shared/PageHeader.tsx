interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="bg-su-navy text-white py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 text-blue-200 text-lg max-w-3xl">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
