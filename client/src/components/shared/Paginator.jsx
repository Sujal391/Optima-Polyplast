import React, { useMemo } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '../ui/pagination';

// Reusable, shadcn-based pagination component
// Props:
// - page: number (1-based)
// - total: number (total items)
// - pageSize: number (items per page)
// - onPageChange: (nextPage: number) => void
// - siblingCount: number (how many pages to show on each side of current)
// - className?: string
export default function Paginator({
  page,
  total,
  pageSize = 10,
  onPageChange,
  siblingCount = 1,
  className,
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 10)));

  const paginationRange = useMemo(() => {
    // returns an array like [1, '...', 5, 6, 7, '...', 20]
    const DOTS = 'dots';
    if (siblingCount < 0) siblingCount = 1;

    const totalPageNumbers = siblingCount * 2 + 5; // first, last, current, 2 DOTS

    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(page - siblingCount, 1);
    const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!showLeftDots && showRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, DOTS, totalPages];
    }

    if (showLeftDots && !showRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + 1 + i
      );
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (showLeftDots && showRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [page, totalPages, siblingCount]);

  const goTo = (p) => {
    if (!onPageChange) return;
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== page) onPageChange(next);
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => goTo(page - 1)} href="#" />
        </PaginationItem>

        {paginationRange.map((item, idx) => {
          if (item === 'dots') {
            return (
              <PaginationItem key={`dots-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          const pageNumber = item;
          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#"
                isActive={pageNumber === page}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(pageNumber);
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext onClick={() => goTo(page + 1)} href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

