"use client";

import React, { useEffect, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Person, Relationship } from "@/types";
import FamilyNodeCard from "./FamilyNodeCard";
import { ZoomInIcon, ZoomOutIcon, RefreshCw as ResetIcon } from "lucide-react";

interface SpouseData {
  person: Person;
  note?: string | null;
}

const sortByBirthDate = (a: Person, b: Person) => {
  const pA = a as any;
  const pB = b as any;
  
  const yearA = pA.birth_year ?? 9999;
  const yearB = pB.birth_year ?? 9999;
  if (yearA !== yearB) return yearA - yearB;

  const monthA = pA.birth_month ?? 99;
  const monthB = pB.birth_month ?? 99;
  if (monthA !== monthB) return monthA - monthB;

  const dayA = pA.birth_day ?? 99;
  const dayB = pB.birth_day ?? 99;
  if (dayA !== dayB) return dayA - dayB;

  const hourA = pA.birth_hour ?? 99;
  const hourB = pB.birth_hour ?? 99;
  if (hourA !== hourB) return hourA - hourB;

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="w-full h-full bg-stone-50">
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
      <TransformWrapper
        initialScale={1}
        minScale={0.2}
        maxScale={2.0}
        centerOnInit
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-24 right-4 z-10 flex flex-col gap-2">
              <button onClick={() => zoomIn()} className="p-2 bg-white rounded-md shadow-md"><ZoomInIcon/></button>
              <button onClick={() => zoomOut()} className="p-2 bg-white rounded-md shadow-md"><ZoomOutIcon/></button>
              <button onClick={() => resetTransform()} className="p-2 bg-white rounded-md shadow-md"><ResetIcon/></button>
            </div>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "calc(100vh - 200px)" }}
              contentStyle={{ width: "max-content" }}
            >
              <div
                id="export-container"
                className="w-max min-w-full mx-auto p-4 css-tree"
              >
                <ul>
                  {roots.slice().sort(sortByBirthDate).map((root) => (
                    <React.Fragment key={root.id}>
                      {renderTreeNode(root.id)}
                    </React.Fragment>
                  ))}
                </ul>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
