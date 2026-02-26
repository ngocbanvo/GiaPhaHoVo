"use client";

import React, { useEffect, useRef, useState } from "react";

import { Person, Relationship } from "@/types";
import FamilyNodeCard from "./FamilyNodeCard";

interface SpouseData {
  person: Person;
  note?: string | null;
}

// THUẬT TOÁN SẮP XẾP CHUẨN: LỚN TUỔI ĐỨNG TRÁI (SINH TRƯỚC), NHỎ TUỔI ĐỨNG PHẢI
const sortByBirthDate = (a: Person, b: Person) => {
  const pA = a as any;
  const pB = b as any;
  
  // 1. So sánh Năm
  const yearA = pA.birth_year ?? 9999;
  const yearB = pB.birth_year ?? 9999;
  if (yearA !== yearB) return yearA - yearB;

  // 2. So sánh Tháng
  const monthA = pA.birth_month ?? 99;
  const monthB = pB.birth_month ?? 99;
  if (monthA !== monthB) return monthA - monthB;

  // 3. So sánh Ngày
  const dayA = pA.birth_day ?? 99;
  const dayB = pB.birth_day ?? 99;
  if (dayA !== dayB) return dayA - dayB;

  // 4. So sánh Giờ
  const hourA = pA.birth_hour ?? 99;
  const hourB = pB.birth_hour ?? 99;
  if (hourA !== hourB) return hourA - hourB;

  // 5. So sánh Phút
  const minA = pA.birth_minute ?? 99;
  const minB = pB.birth_minute ?? 99;
  return minA - minB;
};

export default function FamilyTree({
  personsMap,
  relationships,
  roots,
}: {
  personsMap: Map<string, Person>;
  relationships: Relationship[];
  roots: Person[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
  
  // GIẢI PHÁP CHỐNG LỖI HYDRATION:
  // Đảm bảo code chỉ vẽ cây sau khi đã tải xong trên trình duyệt Client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Center the scroll area horizontally on initial render
    if (containerRef.current) {
      const el = containerRef.current;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, [roots]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPressed(true);
    hasDraggedRef.current = false;
    setDragStart({ x: e.pageX, y: e.pageY });
    if (containerRef.current) {
      setScrollStart({
        left: containerRef.current.scrollLeft,
        top: containerRef.current.scrollTop,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPressed || !containerRef.current) return;

    const dx = e.pageX - dragStart.x;
    const dy = e.pageY - dragStart.y;

    if (!hasDraggedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      setIsDragging(true);
      hasDraggedRef.current = true;
    }

    if (hasDraggedRef.current) {
      e.preventDefault();
      containerRef.current.scrollLeft = scrollStart.left - dx;
      containerRef.current.scrollTop = scrollStart.top - dy;
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsPressed(false);
    setIsDragging(false);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      hasDraggedRef.current = false;
    }
  };

  const getTreeData = (personId: string) => {
    const spousesList: SpouseData[] = relationships
      .filter(
        (r) =>
          r.type === "marriage" &&
          (r.person_a === personId || r.person_b === personId),
      )
      .map((r) => {
        const spouseId = r.person_a === personId ? r.person_b : r.person_a;
        return {
          person: personsMap.get(spouseId)!,
          note: r.note,
        };
      })
      .filter((s) => s.person);

    const childRels = relationships.filter(
      (r) =>
        (r.type === "biological_child" || r.type === "adopted_child") &&
        r.person_a === personId,
    );

    const childrenList = childRels
      .map((r) => personsMap.get(r.person_b))
      .filter(Boolean) as Person[];

    // Áp dụng sắp xếp anh trước em sau
    childrenList.sort(sortByBirthDate);

    return {
      person: personsMap.get(personId)!,
      spouses: spousesList,
      children: childrenList,
    };
  };

  const renderTreeNode = (personId: string): React.ReactNode => {
    const data = getTreeData(personId);
    if (!data.person) return null;

    return (
      <li key={personId}>
        <div className="node-container inline-flex flex-col items-center">
          <div className="flex relative z-10 bg-white rounded-2xl shadow-md border border-stone-200/80 transition-opacity">
            <FamilyNodeCard person={data.person} isMainNode={true} />

            {data.spouses.length > 0 && (
              <>
                {data.spouses.map((spouseData, idx) => (
                  <div key={spouseData.person.id} className="flex relative">
                    <FamilyNodeCard
                      isRingVisible={idx === 0}
                      isPlusVisible={idx > 0}
                      person={spouseData.person}
                      role={
                        spouseData.person.gender === "male" ? "Chồng" : "Vợ"
                      }
                      note={spouseData.note}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {data.children.length > 0 && (
          <ul>
            {data.children.map((child) => (
              <React.Fragment key={child.id}>
                {renderTreeNode(child.id)}
              </React.Fragment>
            ))}
          </ul>
        )}
      </li>
    );
  };

  // Nếu chưa mounted xong ở Client thì trả về màn hình chờ để tránh lỗi Hydration
  if (!mounted) {
    return <div className="w-full min-h-screen bg-stone-50" />;
  }

  if (roots.length === 0)
    return (
      <div className="text-center p-10 text-stone-500">
        Không tìm thấy dữ liệu.
      </div>
    );

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-auto bg-stone-50 ${isPressed ? "cursor-grabbing" : "cursor-grab"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onClickCapture={handleClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .css-tree ul {
          padding-top: 30px; 
          position: relative;
          display: flex;
          justify-content: center;
          padding-left: 0;
        }
        .css-tree li {
          float: left; text-align: center;
          list-style-type: none;
          position: relative;
          padding: 30px 5px 0 5px;
        }
        .css-tree li::before, .css-tree li::after {
          content: '';
          position: absolute; top: 0; right: 50%;
          border-top: 2px solid #d6d3d1;
          width: 50%; height: 30px;
        }
        .css-tree li::after {
          right: auto; left: 50%;
          border-left: 2px solid #d6d3d1;
        }
        .css-tree li:only-child::after {
          display: none;
        }
        .css-tree li:only-child::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid #d6d3d1;
          width: 0;
          height: 30px;
        }
        .css-tree ul:first-child > li {
          padding-top: 0px;
        }
        .css-tree ul:first-child > li::before {
          display: none;
        }
        .css-tree li:first-child::before, .css-tree li:last-child::after {
          border: 0 none;
        }
        .css-tree li:last-child::before {
          border-right: 2px solid #d6d3d1;
          border-radius: 0 12px 0 0;
        }
        .css-tree li:first-child::after {
          border-radius: 12px 0 0 0;
        }
        .css-tree ul ul::before {
          content: '';
          position: absolute; top: 0; left: 50%;
          border-left: 2px solid #d6d3d1;
          width: 0; height: 30px;
        }
      `,
        }}
      />

      <div
        id="export-container"
        className={`w-max min-w-full mx-auto p-4 css-tree transition-opacity duration-200 ${isDragging ? "opacity-90" : ""}`}
      >
        <ul>
          {roots.slice().sort(sortByBirthDate).map((root) => (
            <React.Fragment key={root.id}>
              {renderTreeNode(root.id)}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
}
