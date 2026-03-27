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
  // dynamicUserMappingに加えて、現在のタイムラインに含まれるすべてのユーザー/ラベルをリソースとして追加する。
  // これにより、Notionプロジェクトなどの「本来リソースにいない項目」もカレンダー上に表示されるようになる。
  const allResources = useMemo(() => {
    const resSet = new Set(Object.values(dynamicUserMapping));
    timeline.forEach(item => {
      // ユーザーが明記されている場合
      if (item.users) {
        item.users.forEach(u => resSet.add(u));
      }
      // サブタイトル（案件名や顧客名）をリソースとして扱う（Parking用）
      if (item.subtitle && item.type === 'project') {
        resSet.add(item.subtitle);
      }
      // 現場案件の固定リソース
      if (item.type === 'general') {
        resSet.add("現場");
        resSet.add("お兄さん");
      }
    });

    // どのリソースにも属さない「未割当」などを追加したくない場合はここでフィルタ
    return Array.from(resSet)
      .filter(name => name && !hiddenMemberNames.includes(name))
      .map(name => ({ id: name, title: name }));
  }, [dynamicUserMapping, timeline, hiddenMemberNames]);

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
          // リソースIDの決定
          let resourceIds = [];
          if (item.type === 'general') {
            resourceIds = ["現場", "お兄さん"];
          } else {
            // カレンダーイベントのユーザー、またはプロジェクトのサブタイトル（顧客名）をリソースにする
            const potentialResources = Array.from(new Set(item.users || (item.subtitle ? [item.subtitle] : [])));
            resourceIds = potentialResources.filter(name => !hiddenMemberNames.includes(name));
          }
          
          if (resourceIds.length === 0) return [];

          return [{
            id: item.id,
            resourceIds: resourceIds,
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
