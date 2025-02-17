import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface Provider {
  type: string;
  count: number;
  isCancelled: boolean;
  _id: string;
}

interface AssignedProvider {
  providerId: string;
  providerName: string;
  providerType: string;
  _id: string;
  providerDetails: {
    providerType: string;
    [key: string]: any;
  };
}

interface Appointment {
  _id: string;
  facilityId: string;
  facilityName: string;
  scheduledDateTime: string;
  noOfProvidersRequired: Provider[];
  assignedProviders: AssignedProvider[];
  address: string;
}

// Sample data matching the API response structure
const sampleData = {
  status: true,
  message: "Schedules fetched Successfully",
  response: [
    {
      _id: "67875a93b4b6f496a279d06a",
      facilityId: "675bdabe190660df34291b47",
      address: "Floor No : 4 near, near Phase VIII, Sector 62, Sahibzada Ajit Singh Nagar, Lamba, Punjab 160062, India",
      facilityName: "FORTIES",
      scheduledDateTime: "2025-02-22T20:03:00.000Z",
      noOfProvidersRequired: [
        {
          type: "Anesthesiologist",
          count: 3,
          isCancelled: false,
          _id: "67ac7d7b48acafe326f7dc14"
        },
        {
          type: "CRNA",
          count: 1,
          isCancelled: false,
          _id: "67ac7d7b48acafe326f7dc15"
        }
      ],
      assignedProviders: [
        {
          providerId: "67a59ac27790b04df3c7f922",
          providerScheduleId: "67ac7d3b48acafe326f7d4b0",
          assignedDateTime: "2025-02-22T15:00:00.000Z",
          providerName: "jatin",
          providerType: "CRNA",
          _id: "67ad923a48acafe326f990e0",
          providerDetails: {
            providerType: "CRNA"
          }
        }
      ]
    },
    {
      _id: "67920572a59906b64d438ca6",
      facilityId: "67401d38bf9ff4e5b0cc95f7",
      address: "Via L. Mercantini, 26, 60019 Senigallia AN, Italy",
      facilityName: "CITY PARK12",
      scheduledDateTime: "2025-02-19T15:00:00.000Z",
      noOfProvidersRequired: [
        {
          type: "CRNA",
          count: 1,
          isCancelled: false,
          _id: "67920572a59906b64d438ca7"
        },
        {
          type: "RN PACU/ICU",
          count: 1,
          isCancelled: false,
          _id: "67920572a59906b64d438ca8"
        }
      ],
      assignedProviders: []
    }
  ]
};

const DraggableProvider = ({
  provider,
  isPastDate,
  assignedProviders,
  providerType,
}: {
  provider: Provider;
  isPastDate: boolean;
  assignedProviders: AssignedProvider[];
  providerType: string;
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PROVIDER",
    item: { provider },
    canDrag: () => !isPastDate,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Create multiple provider slots based on count
  const slots = Array(provider.count).fill(null);

  // Find assigned providers of this type
  const assignedOfType = assignedProviders.filter(
    (ap) => ap.providerType === provider.type
  );

  return (
    <>
      {slots.map((_, index) => {
        const assignedProvider = assignedOfType[index];
        return (
          <div
            key={`${provider._id}-${index}`}
            ref={drag}
            className={`p-2 mb-2 border rounded cursor-pointer transition-transform transform ${
              isDragging ? "opacity-50 scale-95" : "bg-white hover:scale-105"
            } ${isPastDate ? "cursor-not-allowed" : ""}`}
          >
            {assignedProvider ? (
              `${assignedProvider.providerName} (${provider.type})`
            ) : (
              `Open ${provider.type} Position`
            )}
            {provider.isCancelled ? " (cancelled)" : ""}
          </div>
        );
      })}
    </>
  );
};

const DroppableCell = ({
  facility,
  date,
  providers,
  moveProvider,
  isPastDate,
  assignedProviders,
}: {
  facility: string;
  date: string;
  providers: Provider[];
  moveProvider: (facility: string, date: string, provider: Provider) => void;
  isPastDate: boolean;
  assignedProviders: AssignedProvider[];
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
      className={`border p-2 min-w-[200px] align-top transition-colors ${
        isPastDate ? "bg-gray-300" : "hover:bg-gray-100"
      }`}
    >
      {providers.map((provider) => (
        <DraggableProvider
          key={provider._id}
          provider={provider}
          isPastDate={isPastDate}
          assignedProviders={assignedProviders}
          providerType={provider.type}
        />
      ))}
    </td>
  );
};

const AppointmentTable = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(
    sampleData.response
  );

  const moveProvider = (facility: string, date: string, provider: Provider) => {
    setAppointments((prev) => {
      let providerMoved = false;

      // Remove provider from previous location
      const updatedAppointments = prev.map((appointment) => {
        if (
          appointment.noOfProvidersRequired.some((p) => p._id === provider._id)
        ) {
          return {
            ...appointment,
            noOfProvidersRequired: appointment.noOfProvidersRequired.filter(
              (p) => p._id !== provider._id
            ),
          };
        }
        return appointment;
      });

      // Add provider to new location
      const finalAppointments = updatedAppointments.map((appointment) => {
        if (
          new Date(appointment.scheduledDateTime).toLocaleDateString() === date &&
          appointment.facilityName === facility
        ) {
          providerMoved = true;
          return {
            ...appointment,
            noOfProvidersRequired: [...appointment.noOfProvidersRequired, provider],
          };
        }
        return appointment;
      });

      if (!providerMoved) {
        finalAppointments.push({
          _id: Math.random().toString(),
          facilityId: "",
          facilityName: facility,
          scheduledDateTime: new Date(date).toISOString(),
          noOfProvidersRequired: [provider],
          assignedProviders: [],
          address: "",
        });
      }

      return finalAppointments;
    });
  };

  const uniqueDates = Array.from(
    new Set(
      appointments.map((appt) =>
        new Date(appt.scheduledDateTime).toLocaleDateString()
      )
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
                          new Date(appt.scheduledDateTime).toLocaleDateString() ===
                            date && appt.facilityName === facility
                      )
                      .flatMap((appt) => appt.noOfProvidersRequired)}
                    moveProvider={moveProvider}
                    isPastDate={true}
                    assignedProviders={appointments
                      .filter(
                        (appt) =>
                          new Date(appt.scheduledDateTime).toLocaleDateString() ===
                            date && appt.facilityName === facility
                      )
                      .flatMap((appt) => appt.assignedProviders)}
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
                          new Date(appt.scheduledDateTime).toLocaleDateString() ===
                            date && appt.facilityName === facility
                      )
                      .flatMap((appt) => appt.noOfProvidersRequired)}
                    moveProvider={moveProvider}
                    isPastDate={false}
                    assignedProviders={appointments
                      .filter(
                        (appt) =>
                          new Date(appt.scheduledDateTime).toLocaleDateString() ===
                            date && appt.facilityName === facility
                      )
                      .flatMap((appt) => appt.assignedProviders)}
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