export function Card({ title, price }: { title: string; price: string }) {
  return (
    <div className="relative flex space-x-4 rounded-l-lg border-l-4 pl-6 pr-2 text-left">
      <span className="absolute right-3 top-3 ml-2">New</span>
      <h3 className="md:text-right hover:pl-8">{title}</h3>
      <svg className="size-4 rtl:-scale-x-100 rtl:mr-1" aria-hidden="true" />
      <p style={{ marginLeft: 8, textAlign: 'left' }}>{price}</p>
      <p className="text-gray-500">Left in stock: 3</p>
    </div>
  );
}
