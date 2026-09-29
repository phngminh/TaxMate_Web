import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../ui/pagination'

type TaxPaginationProps = {
  page: number
  pageSize: number
  totalCount: number
  itemLabel: string
  onPageChange: (page: number) => void
}

export default function TaxPagination({
  page,
  pageSize,
  totalCount,
  itemLabel,
  onPageChange,
}: TaxPaginationProps) {
  if (totalCount <= 0) return null

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className='border-t border-gray-100 p-4 flex flex-wrap items-center justify-between gap-3'>
      <span className='text-[13px] text-gray-500 font-semibold'>
        Hiển thị <span className='font-bold text-gray-800'>{totalCount}</span> {itemLabel}
      </span>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className={page === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive>{page}</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className={page >= totalPages ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
