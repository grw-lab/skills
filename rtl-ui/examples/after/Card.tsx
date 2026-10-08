export function Card({ title, price }: { title: string; price: string }) {
  return (
    <div className="relative flex gap-4 rounded-s-lg border-s-4 ps-6 pe-2 text-start">
      <span className="absolute end-3 top-3 ms-2">New</span>
      <h3 className="md:text-end hover:ps-8">{title}</h3>
      <svg className="size-4 rtl:-scale-x-100" aria-hidden="true" />
      <p style={{ marginInlineStart: 8, textAlign: 'start' }}>
        <bdi>{price}</bdi>
      </p>
      <p className="text-gray-500">Left in stock: 3</p>
    </div>
  );
}
