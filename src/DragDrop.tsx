import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface Provider {
  name: string;
  isCancelled: boolean;
}

interface AuthorizedProvider {
  name: string;
}

interface Appointment {
  setTime: string;
  facilityName: string;
  providers: Provider[];
  authorizedProviders: AuthorizedProvider[];
}

const initialAppointments: Appointment[] = [
  {
    setTime: "2025-02-20T10:30:00Z",
    facilityName: "Fortis",
    providers: [
      { name: "CRN", isCancelled: true },
      { name: "Neuro", isCancelled: false },
    ],
    authorizedProviders: [{ name: "Neuro" }],
  },
  {
    setTime: "2025-02-20T10:30:00Z",
    facilityName: "Fortis",
    providers: [
      { name: "Cardiology", isCancelled: false },
      { name: "Orthopedics", isCancelled: true },
    ],
    authorizedProviders: [{ name: "Cardiology" }],
  },
  {
    setTime: "2025-02-21T14:00:00Z",
    facilityName: "Apollo",
    providers: [
      { name: "Dermatology", isCancelled: false },
      { name: "ENT", isCancelled: false },
    ],
    authorizedProviders: [{ name: "Dermatology" }, { name: "ENT" }],
  },
  {
    setTime: "2025-02-22T09:00:00Z",
    facilityName: "Max Healthcare",
    providers: [
      { name: "Gastroenterology", isCancelled: false },
      { name: "Nephrology", isCancelled: true },
    ],
    authorizedProviders: [{ name: "Gastroenterology" }],
  },
  {
    setTime: "2025-02-22T09:00:00Z",
    facilityName: "Max Healthcare",
    providers: [
      { name: "Oncology", isCancelled: false },
      { name: "Urology", isCancelled: false },
    ],
    authorizedProviders: [{ name: "Oncology" }, { name: "Urology" }],
  },
  {
    setTime: "2024-12-15T11:00:00Z",
    facilityName: "Medanta",
    providers: [
      { name: "Pediatrics", isCancelled: false },
      { name: "Neurology", isCancelled: false },
    ],
    authorizedProviders: [{ name: "Pediatrics" }],
  },
  {
    setTime: "2024-11-10T16:30:00Z",
    facilityName: "AIIMS",
    providers: [
      { name: "Ophthalmology", isCancelled: true },
      { name: "Radiology", isCancelled: false },
    ],
    authorizedProviders: [{ name: "Radiology" }],
  },
];

const DraggableProvider = ({
  provider,
  isPastDate,
  authorizedProviders,
}: {
  provider: Provider;
  isPastDate: boolean;
  authorizedProviders: AuthorizedProvider[];
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PROVIDER",
    item: { provider },
    canDrag: () => !isPastDate,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const isAuthorized = authorizedProviders.some(
    (authProvider) => authProvider.name === provider.name
  );

  return (
    <div
      ref={drag}
      className={`p-2 border rounded cursor-pointer transition-transform transform ${
        isDragging ? "opacity-50 scale-95" : "bg-white hover:scale-105"
      } ${isPastDate ? "cursor-not-allowed" : ""}`}
    >
      {isAuthorized ? "(dev) " : ""}
      {provider.name}
      {provider.isCancelled ? " (cancelled)" : ""}
    </div>
  );
};

const DroppableCell = ({
  facility,
  date,
  providers,
  moveProvider,
  isPastDate,
  authorizedProviders,
}: {
  facility: string;
  date: string;
  providers: Provider[];
  moveProvider: (facility: string, date: string, provider: Provider) => void;
  isPastDate: boolean;
  authorizedProviders: AuthorizedProvider[];
}) => {
  const [, drop] = useDrop({
    accept: "PROVIDER",
    drop: (item: { provider: Provider }) =>
      moveProvider(facility, date, item.provider),
    canDrop: () => !isPastDate,
  });

  return (
    <td
      ref={drop}
      className={`border p-2 min-w-[150px] align-top transition-colors ${
        isPastDate ? "bg-gray-300" : "hover:bg-gray-100"
      }`}
    >
      {providers.map((provider, index) => (
        <DraggableProvider
          key={index}
          provider={provider}
          isPastDate={isPastDate}
          authorizedProviders={authorizedProviders}
        />
      ))}
    </td>
  );
};

const AppointmentTable = () => {
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);

  const moveProvider = (facility: string, date: string, provider: Provider) => {
    setAppointments((prev) => {
      let providerMoved = false;

      // Remove provider from previous location
      const updatedAppointments = prev.map((appointment) => {
        if (appointment.providers.some((p) => p.name === provider.name)) {
          return {
            ...appointment,
            providers: appointment.providers.filter(
              (p) => p.name !== provider.name
            ),
          };
        }
        return appointment;
      });

      // Add provider to new location
      const finalAppointments = updatedAppointments.map((appointment) => {
        if (
          new Date(appointment.setTime).toLocaleDateString() === date &&
          appointment.facilityName === facility
        ) {
          providerMoved = true;
          return {
            ...appointment,
            providers: [...appointment.providers, provider],
          };
        }
        return appointment;
      });

      if (!providerMoved) {
        finalAppointments.push({
          setTime: new Date(date).toISOString(),
          facilityName: facility,
          providers: [provider],
          authorizedProviders: [], // Add an empty array or appropriate value
        });
      }

      return finalAppointments;
    });
  };

  const uniqueDates = Array.from(
    new Set(
      appointments.map((appt) => new Date(appt.setTime).toLocaleDateString())
    )
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const pastDates = uniqueDates.filter((date) => new Date(date) < new Date());
  const futureDates = uniqueDates.filter(
    (date) => new Date(date) >= new Date()
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 bg-gray-100 rounded-lg shadow-md">
        <table className="w-full border-collapse border text-left">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-200">Facility</th>
              {pastDates.map((date) => (
                <th key={date} className="border p-2 bg-gray-300">
                  {date}
                </th>
              ))}
              {futureDates.map((date) => (
                <th key={date} className="border p-2 bg-gray-200">
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(
              new Set(appointments.map((appt) => appt.facilityName))
            ).map((facility, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="border p-2 font-bold align-top bg-gray-200">
                  {facility}
                </td>
                {pastDates.map((date) => (
                  <DroppableCell
                    key={date}
                    facility={facility}
                    date={date}
                    providers={appointments
                      .filter(
                        (appt) =>
                          new Date(appt.setTime).toLocaleDateString() ===
                            date && appt.facilityName === facility
                      )
                      .flatMap((appt) => appt.providers)}
                    moveProvider={moveProvider}
                    isPastDate={true}
                    authorizedProviders={
                      appointments.find(
                        (appt) =>
                          new Date(appt.setTime).toLocaleDateString() ===
                            date && appt.facilityName === facility
                      )?.authorizedProviders || []
                    }
                  />
                ))}
                {futureDates.map((date) => (
                  <DroppableCell
                    key={date}
                    facility={facility}
                    date={date}
                    providers={appointments
                      .filter(
                        (appt) =>
                          new Date(appt.setTime).toLocaleDateString() ===
                            date && appt.facilityName === facility
                      )
                      .flatMap((appt) => appt.providers)}
                    moveProvider={moveProvider}
                    isPastDate={false}
                    authorizedProviders={
                      appointments.find(
                        (appt) =>
                          new Date(appt.setTime).toLocaleDateString() ===
                            date && appt.facilityName === facility
                      )?.authorizedProviders || []
                    }
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DndProvider>
  );
};

export default AppointmentTable;
