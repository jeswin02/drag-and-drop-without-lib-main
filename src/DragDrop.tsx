import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface Provider {
  name: string;
  isCancelled: boolean;
}

interface Appointment {
  setTime: string;
  facilityName: string;
  providers: Provider[];
}

const initialAppointments: Appointment[] = [
  {
    setTime: "2025-02-20T10:30:00Z",
    facilityName: "Fortis",
    providers: [
      { name: "CRN", isCancelled: true },
      { name: "Neuro", isCancelled: false },
    ],
  },
  {
    setTime: "2025-02-20T10:30:00Z",
    facilityName: "Fortis",
    providers: [
      { name: "Cardiology", isCancelled: false },
      { name: "Orthopedics", isCancelled: true },
    ],
  },
  {
    setTime: "2025-02-21T14:00:00Z",
    facilityName: "Apollo",
    providers: [
      { name: "Dermatology", isCancelled: false },
      { name: "ENT", isCancelled: false },
    ],
  },
  {
    setTime: "2025-02-22T09:00:00Z",
    facilityName: "Max Healthcare",
    providers: [
      { name: "Gastroenterology", isCancelled: false },
      { name: "Nephrology", isCancelled: true },
    ],
  },
  {
    setTime: "2025-02-22T09:00:00Z",
    facilityName: "Max Healthcare",
    providers: [
      { name: "Oncology", isCancelled: false },
      { name: "Urology", isCancelled: false },
    ],
  },
];

const DraggableProvider = ({ provider }: { provider: Provider }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PROVIDER",
    item: { provider },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-2 border rounded cursor-pointer ${
        isDragging ? "opacity-50" : "bg-white"
      }`}
    >
      {provider.name} {provider.isCancelled ? "(cancelled)" : "(dev)"}
    </div>
  );
};

const DroppableCell = ({
  facility,
  date,
  providers,
  moveProvider,
}: {
  facility: string;
  date: string;
  providers: Provider[];
  moveProvider: (facility: string, date: string, provider: Provider) => void;
}) => {
  const [, drop] = useDrop({
    accept: "PROVIDER",
    drop: (item: { provider: Provider }) =>
      moveProvider(facility, date, item.provider),
  });

  return (
    <td ref={drop} className="border p-2 min-w-[150px] align-top">
      {providers.map((provider, index) => (
        <DraggableProvider key={index} provider={provider} />
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
        });
      }

      return finalAppointments;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        <table className="w-full border-collapse border text-left">
          <thead>
            <tr>
              <th className="border p-2">Facility</th>
              <th className="border p-2">2/14/2025</th>
              <th className="border p-2">2/20/2025</th>
              <th className="border p-2">2/21/2025</th>
              <th className="border p-2">2/22/2025</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(
              new Set(appointments.map((appt) => appt.facilityName))
            ).map((facility, index) => (
              <tr key={index}>
                <td className="border p-2 font-bold align-top">{facility}</td>
                {["2/14/2025", "2/20/2025", "2/21/2025", "2/22/2025"].map(
                  (date) => (
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
                    />
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DndProvider>
  );
};

export default AppointmentTable;
