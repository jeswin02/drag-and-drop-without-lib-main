import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import sampleData from './response.json';

interface Provider {
  type: string;
  count: number;
  isCancelled: boolean;
  _id: string;
}

interface ProviderDetails {
  providerPermissions: {
    isOnCall: boolean;
  };
  adminSettingPermissions: {
    isProviderInvoiceApprovals: boolean;
    isEditedClockEntryAllow: boolean;
  };
  providerType?: string;
  [key: string]: any;
}

interface ProviderScheduleDetails {
  providerId: string;
  providerName: string;
  availabilityDate: string;
  status: string;
  assignedDateTime: string;
  [key: string]: any;
}

interface AssignedProvider {
  providerId: string;
  providerScheduleId: string;
  assignedDateTime: string;
  providerName: string;
  providerType?: string;
  _id: string;
  providerDetails: ProviderDetails;
  providerScheduleDetails: ProviderScheduleDetails;
}

interface Appointment {
  _id: string;
  facilityId: string;
  facilityName: string;
  address: string;
  scheduledDateTime: string;
  noOfProvidersRequired: Provider[];
  assignedProviders: AssignedProvider[];
  roomsAvailable?: number;
  schedulingNote?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface DraggableProviderProps {
  provider: Provider;
  isPastDate: boolean;
  assignedProviders: AssignedProvider[];
  providerType: string;
}

const DraggableProvider: React.FC<DraggableProviderProps> = ({
  provider,
  isPastDate,
  assignedProviders,
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
    (ap) => ap.providerType === provider.type || ap.providerDetails.providerType === provider.type
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

interface DroppableCellProps {
  facility: string;
  date: string;
  providers: Provider[];
  moveProvider: (facility: string, date: string, provider: Provider) => void;
  isPastDate: boolean;
  assignedProviders: AssignedProvider[];
}

const DroppableCell: React.FC<DroppableCellProps> = ({
  facility,
  date,
  providers,
  moveProvider,
  isPastDate,
  assignedProviders,
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

const AppointmentTable: React.FC = () => {
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