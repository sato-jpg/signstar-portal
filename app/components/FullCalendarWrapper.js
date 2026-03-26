"use client";

import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function FullCalendarWrapper({ 
  selectedDate, 
  dynamicUserMapping, 
  visibleMemberNames, 
  timeline, 
  handleEventDrop, 
  setSelectedEvent 
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[800px] p-4 text-sm relative z-0">
      <FullCalendar
        schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
        plugins={[ resourceTimeGridPlugin, resourceDayGridPlugin, timeGridPlugin, dayGridPlugin, interactionPlugin ]}
        initialView="resourceTimeGridDay"
        initialDate={selectedDate}
        resources={Array.from(new Set(Object.values(dynamicUserMapping)))
          .filter(name => visibleMemberNames.has(name))
          .map(name => ({ id: name, title: name }))}
        events={timeline.flatMap(item => {
          const matchingResourceNames = Array.from(new Set(item.users || [item.subtitle] || [])).filter(name => visibleMemberNames.has(name));
          
          if (matchingResourceNames.length === 0 && item.type !== 'general') return [];
          
          const resourceIds = item.type === 'general' ? ["現場", "お兄さん"] : matchingResourceNames;

          if (resourceIds.length === 0) return [];

          return [{
            id: item.id,
            resourceIds: resourceIds,
            title: item.title,
            start: item.time,
            end: item.type === 'calendar' ? (item.raw?.end?.dateTime || item.raw?.end?.date || new Date(item.time.getTime() + 60*60*1000)) : new Date(item.time.getTime() + 60*60*1000),
            backgroundColor: item.type === 'calendar' ? (item.calendarColor || '#3b82f6') : (item.type === 'general' ? '#d71d1d' : '#888888'),
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
