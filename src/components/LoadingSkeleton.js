import React from 'react';

// 기본 스켈레톤 컴포넌트
export const Skeleton = ({ className = "", width = "w-full", height = "h-4" }) => (
  <div className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`}></div>
);

// 카드 스켈레톤
export const CardSkeleton = ({ showImage = false, lines = 3 }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    {showImage && (
      <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
    )}
    <div className="space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
      ))}
      <div className="flex space-x-2 mt-4">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

// 리스트 아이템 스켈레톤
export const ListItemSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="flex items-center space-x-4 mt-4">
          <div className="h-6 bg-gray-200 rounded w-12"></div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
      <div className="h-5 bg-gray-200 rounded w-5"></div>
    </div>
  </div>
);

// 테이블 스켈레톤
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
    {/* Rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 스터디 카드 스켈레톤
export const StudyCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 space-y-2">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

// 투표 카드 스켈레톤  
export const PollCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-3 mb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-8"></div>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
      <div className="h-8 bg-gray-200 rounded w-16"></div>
    </div>
  </div>
);

// 정보공유 카드 스켈레톤
export const TrendCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    <div className="w-full h-48 bg-gray-200"></div>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="h-4 bg-gray-200 rounded w-8"></div>
          <div className="h-4 bg-gray-200 rounded w-8"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-4"></div>
      </div>
    </div>
  </div>
);

// 페이지 로딩 스켈레톤
export const PageLoadingSkeleton = ({ type = "cards", count = 6 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case "studies":
        return <StudyCardSkeleton />;
      case "polls":
        return <PollCardSkeleton />;
      case "trends":
        return <TrendCardSkeleton />;
      case "list":
        return <ListItemSkeleton />;
      case "table":
        return <TableSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  const getGridClass = () => {
    switch (type) {
      case "trends":
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";
      case "polls":
      case "studies":
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      case "list":
        return "space-y-4";
      case "table":
        return "";
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    }
  };

  if (type === "table") {
    return renderSkeleton();
  }

  return (
    <div className={getGridClass()}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};