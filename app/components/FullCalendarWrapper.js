"use client";

import { useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function FullCalendarWrapper({ 
  selectedDate, 
  activeCategory,
  dynamicUserMapping, 
  hiddenMemberNames, 
  timeline, 
  handleEventDrop, 
  setSelectedEvent 
}) {
  const calendarRef = useRef(null);

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(selectedDate);
    }
  }, [selectedDate]);

  // 1. 全リソースのリスト。
  // activeCategory（表示モード）に応じて、表示する「列（リソース）」を限定する。
  const allResources = useMemo(() => {
    const resSet = new Set();

    // モードに応じた「必ず表示する」基本情報の決定
    if (activeCategory === 'general') {
      // 現場ページ（一般案件）の場合は、現場と、お兄さんの2名のみ
      resSet.add("現場");
      resSet.add("お兄さん");
    } else if (activeCategory === 'parking') {
      // パーキングモードの場合は、タイムライン内の顧客名など（空でも良いが必要に応じて）
      timeline.forEach(item => {
        if (item.subtitle && item.type === 'project') resSet.add(item.subtitle);
      });
    } else {
      // 「すべて」またはその他の場合は、全メンバー + 案件
      Object.values(dynamicUserMapping).forEach(name => resSet.add(name));
      timeline.forEach(item => {
        if (item.users) item.users.forEach(u => resSet.add(u));
        if (item.subtitle && item.type === 'project') resSet.add(item.subtitle);
        if (item.type === 'general') {
          resSet.add("現場");
          resSet.add("お兄さん");
        }
      });
    }

    return Array.from(resSet)
      .filter(name => name && !hiddenMemberNames.includes(name))
      .map(name => ({ id: name, title: name }));
  }, [dynamicUserMapping, timeline, hiddenMemberNames, activeCategory]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[800px] p-4 text-sm relative z-0">
      <FullCalendar
        ref={calendarRef}
        schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
        plugins={[ resourceTimeGridPlugin, resourceDayGridPlugin, timeGridPlugin, dayGridPlugin, interactionPlugin ]}
        initialView="resourceTimeGridDay"
        initialDate={selectedDate || new Date()}
        resources={allResources}
        events={timeline.flatMap(item => {
          // リソースIDの決定。アイテムがどの列に表示されるか。
          let resourceIds = [];
          if (item.type === 'general') {
            resourceIds = ["現場", "お兄さん"];
          } else {
            // カレンダーイベントのユーザー、またはプロジェクトのサブタイトル（顧客名）をリソースにする
            const potentialResources = Array.from(new Set(item.users || (item.subtitle ? [item.subtitle] : [])));
            resourceIds = potentialResources.filter(name => !hiddenMemberNames.includes(name));
          }
          
          // 現在表示中のリソース（allResources）に含まれるもののみフィルタリング
          const activeResourceIds = resourceIds.filter(id => allResources.some(r => r.id === id));
          if (activeResourceIds.length === 0) return [];

          return [{
            id: item.id,
            resourceIds: activeResourceIds,
            title: item.title,
            start: item.time,
            end: item.type === 'calendar' ? (item.raw?.end?.dateTime || item.raw?.end?.date || new Date(item.time.getTime() + 60*60*1000)) : new Date(item.time.getTime() + 60*60*1000),
            backgroundColor: item.type === 'calendar' ? (item.calendarColor || '#3b82f6') : (item.type === 'general' ? '#d71d1d' : (item.type === 'project' ? '#10b981' : '#888888')),
            borderColor: 'transparent',
            editable: item.type === 'calendar',
            allDay: Math.abs(item.time.getTime()) === 0,
            extendedProps: { ...item }
          }];
        })}
        editable={true}
        droppable={true}
        height="100%"
        slotMinTime="05:00:00"
        slotMaxTime="23:00:00"
        headerToolbar={false}
        allDayText="優先"
        eventDrop={handleEventDrop}
        eventResize={handleEventDrop}
        eventClick={(info) => {
          const originalItem = timeline.find(t => t.id === info.event.extendedProps.id);
          if (originalItem) setSelectedEvent(originalItem);
        }}
        slotEventOverlap={false}
      />
    </div>
  );
}
