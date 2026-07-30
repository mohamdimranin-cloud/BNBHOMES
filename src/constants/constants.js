export const roomStatusBg = (roomStatus, roomNum) => {
  switch (roomStatus) {
    case "Early Check-in": return <span className="bg-blue-500 px-7 py-3 rounded text-white">{roomNum}</span>;
    case "Stay Back": return <span className="bg-gray-500 px-7 py-3 rounded text-white">{roomNum}</span>;
    case "Just Occupied": return <span className="bg-yellow-500 px-7 py-3 rounded text-white">{roomNum}</span>;
    case "Over Stay": return <span className="bg-red-500 px-7 py-3 rounded text-white">{roomNum}</span>;
    case "Maintenance": return <span className="bg-orange-500 px-7 py-3 rounded text-white">{roomNum}</span>;
    case "Cleaning Process": return <span className="bg-teal-500 px-7 py-3 rounded text-white">{roomNum}</span>;
    case "Vacant": return <span className="bg-green-500 px-7 py-3 rounded text-white">{roomNum}</span>;
    case "Less Paid": return <span className="bg-purple-500 px-7 py-3 rounded text-white">{roomNum}</span>;
    default: return "";
  }
};

export const StatusAndColor = [
  { label: "Early Check-in", bgColor: "bg-blue-500", txtColor: "text-blue-500", borderColor: "border-blue-500" },
  { label: "Stay Back", bgColor: "bg-gray-500", txtColor: "text-gray-500", borderColor: "border-gray-500" },
  { label: "Just Occupied", bgColor: "bg-yellow-500", txtColor: "text-yellow-500", borderColor: "border-yellow-500" },
  { label: "Less Paid", bgColor: "bg-purple-500", txtColor: "text-purple-500", borderColor: "border-purple-500" },
  { label: "Over Stay", bgColor: "bg-red-500", txtColor: "text-red-500", borderColor: "border-red-500" },
  { label: "Maintenance", bgColor: "bg-orange-500", txtColor: "text-orange-500", borderColor: "border-orange-500" },
  { label: "Cleaning Process", bgColor: "bg-teal-500", txtColor: "text-teal-500", borderColor: "border-teal-500" },
  { label: "Vacant", bgColor: "bg-green-500", txtColor: "text-green-500", borderColor: "border-green-500" },
];

export const flooreNames = ["Ground Floor", "First Floor", "Second Floor", "Third Floor", "Forth Floor", "Fifth Floor"]

const floorOrder = [
  "ground_floor",
  "first_floor",
  "second_floor",
  "third_floor",
  "fourth_floor",
  "fifth_floor"
];

export const sortData = (apiData) => Object.fromEntries(
  Object.entries(apiData).sort(
    ([keyA], [keyB]) =>
      floorOrder.indexOf(keyA) - floorOrder.indexOf(keyB)
  )
);

export const calculateRoomStatus = (data) => {
  const occupiedStatuses = [
    "Early Check-in",
    "Stay Back",
    "Just Occupied",
    "Less Paid",
    "Over Stay"
  ];

  let occupiedCount = 0;
  let unoccupiedCount = 0;

  for (const floor in data) {
    const rooms = data[floor];

    rooms.forEach(room => {
      if (occupiedStatuses.includes(room.status)) {
        occupiedCount++;
      } else {
        unoccupiedCount++;
      }
    });
  }

  return { occupied: occupiedCount, unoccupied: unoccupiedCount };
};

export const calculateTotalStatusCount = (data) => {
  const totalCounts = {};

  Object.values(data).flat().forEach((room) => {
    const status = room.status;
    totalCounts[status] = (totalCounts[status] || 0) + 1;
  });

  return totalCounts;
};

export const trimPath = (filePath) => {
  if (!filePath) return filePath;
  // Strip /uploads/ prefix if present (legacy paths stored with full server path)
  const startIndex = filePath.indexOf('/uploads/');
  const trimmed = startIndex !== -1
    ? filePath.slice(startIndex + '/uploads/'.length)
    : filePath;
  // Remove any leading slash to prevent double-slash in URLs
  return trimmed.replace(/^\/+/, '');
}

export const addEllipsisWithExtension = (filePath, maxLength = 25) => {
  if (!filePath) return filePath;

  const extIndex = filePath.lastIndexOf('.');
  const extension = extIndex !== -1 ? filePath.slice(extIndex) : '';
  const baseFileName = extIndex !== -1 ? filePath.slice(0, extIndex) : filePath;

  if (filePath.length <= maxLength) {
    return filePath;
  }

  const startPart = baseFileName.slice(0, maxLength / 2);
  const endPart = baseFileName.slice(-maxLength / 2);

  return startPart + '...' + endPart + extension;
};

export const getTitleAndDescription = (roomStatus) => {
  switch (roomStatus) {
    case 'Just Occupied':
      return {
        title: 'Room Already Occupied',
        description: 'The room is currently occupied. Please check for availability later.'
      };
    case 'Over Stay':
      return {
        title: 'Room Overstay',
        description: 'The guest has overstayed their check-out time. Room is unavailable for booking at this time.'
      };
    case 'Maintenance':
      return {
        title: 'Room Under Maintenance',
        description: 'The room is undergoing maintenance and is temporarily unavailable.'
      };
    case 'Cleaning Process':
      return {
        title: 'Room Being Cleaned',
        description: 'The room is currently being cleaned and will be available shortly.'
      };
    case 'Vacant':
      return {
        title: 'Room Available',
        description: 'This room is vacant and available for booking.'
      };
    case 'Stay Back':
      return {
        title: 'Room Stay Back',
        description: 'The guest is staying longer than expected. Room will be available once they check out.'
      };
    case 'Early Check-in':
      return {
        title: 'Room Early Check-in',
        description: 'The room is available for early check-in. Welcome!'
      };
    default:
      return {
        title: 'Room Status',
        description: 'The status of this room is currently unknown.'
      };
  }
};

export const GuestDataHeaders = [
  "Log In Tag (Person)",
  "Advance Booking Number",
  "Advance Booking Date",
  "Check-In Date",
  "Check-In Time",
  "Check-Out Date",
  "Number of Days",
  "Booking Reference",
  "Room Type",
  "Room Number",
  "Corporate Name",
  "Guest Name",
  "Guest Mobile Number",
  "Guest WhatsApp Number",
  "Guest Email",
  "Number of Adults",
  "Number of Children",
  "Extra Bed",
  "ID Type",
  "ID Number",
  "Present Photo",
  "ID 1",
  "ID 2",
  "ID 3",
  "Vehicle",
  "Vehicle Number",
  "Discount (If Any)",
  "Discount Reason",
  "Room Amount",
  "GST",
  "Advance Amount",
  "Extra Payment",
  "Extra Payment Reason",
  "Net Payable",
  "Payment Method",
  "All Payment Date",
  "All Payment Time",
  "Balance Payment",
  "Guest Stay ID",
  "Invoice Number",
  "Check-Out Receipt",
  "Auditor Verification",
];

export const flattenObject = (obj, prefix = "") => {
  let result = [];

  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = `${prefix}${key.replace(/_/g, " ")}`;

    if (typeof value === "object" && value !== null) {
      // If it's an array, iterate through each item
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object") {
            result = result.concat(flattenObject(item, `${formattedKey} ${index + 1} - `));
          } else {
            result.push({ label: `${formattedKey} ${index + 1}`, value: item });
          }
        });
      } else {
        // If it's a nested object, recursively flatten it
        result = result.concat(flattenObject(value, `${formattedKey} - `));
      }
    } else {
      // Otherwise, just store the key-value pair
      result.push({ label: formattedKey, value: value ?? "N/A" });
    }
  }

  return result;
};
