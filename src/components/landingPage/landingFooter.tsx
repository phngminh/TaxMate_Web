export default function LandingFooter() {
  return (
    <footer className='bg-slate-900 text-slate-400 py-4 border-t border-slate-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6'>
        <div className='flex items-center'>
          <span className='text-2xl font-bold text-white tracking-tight'>
            TaxMate
          </span>
        </div>
        <p className='text-sm text-slate-500'>
          © {new Date().getFullYear()} TaxMate. Tất cả quyền được bảo lưu. Thiết kế dành riêng cho hộ kinh doanh Việt Nam.
        </p>
      </div>
    </footer>
  )
}