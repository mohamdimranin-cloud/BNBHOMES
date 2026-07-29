export const generateUniqueID = () => {
  // Fixed prefix
  const prefix = 'bnbh-';

  // Get current date and time
  const now = new Date();

  // Format the timestamp to include year, month, date, hour, minute, and second
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of the year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
  const date = now.getDate().toString().padStart(2, '0'); // Day (01-31)
  const hour = now.getHours().toString().padStart(2, '0'); // Hour (00-23)
  const minute = now.getMinutes().toString().padStart(2, '0'); // Minute (00-59)
  const second = now.getSeconds().toString().padStart(2, '0'); // Second (00-59)

  // Combine the date and time components
  const timestamp = year + month + date + hour + minute + second; // Format: YYMMDDHHMMSS

  // Combine prefix with the timestamp
  const bookingReference = prefix + timestamp;

  return bookingReference;
}

export const getToday = () => {
  const today = new Date();

  // Format the date
  const day = String(today.getDate()).padStart(2, '0'); // Add leading zero if needed
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = today.getFullYear();

  // Combine to desired format
  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
}

export const getTodayTime = () => {
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return formattedTime;
}

export const extractDateTime = (dayjsObject) => {
  // Ensure the input is a valid Day.js object
  if (!dayjsObject || typeof dayjsObject.format !== 'function') {
    throw new Error('Invalid Day.js object');
  }

  // Extract date and time
  const formattedDate = dayjsObject.format('DD-MM-YYYY'); // DD-MM-YYYY
  const formattedTime = dayjsObject.format('HH:mm:ss'); // HH:MM:SS

  return {
    date: formattedDate,
    time: formattedTime,
  };
}

export const numberToWords = (num) => {
  const belowTwenty = [
    'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  if (num === 0) return belowTwenty[0];

  let words = '';
  let i = 0;

  while (num > 0) {
    if (num % 1000 !== 0) {
      words = helper(num % 1000) + thousands[i] + ' ' + words;
    }
    num = Math.floor(num / 1000);
    i++;
  }

  return words.trim();

  function helper(n) {
    if (n < 20) return belowTwenty[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + belowTwenty[n % 10] : '') + ' ';
    return belowTwenty[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + helper(n % 100) : '') + ' ';
  }
}

export const calculateTotalPersons = (guestOccupancy) => {
  // return guestOccupancy.reduce((total, guest) => {
  //   const numOfAdults = parseInt(guest.numOfAdults) || 0; // Convert to integer or default to 0
  //   const numOfChildren = parseInt(guest.numOfChildren) || 0; // Handle empty or invalid values
  //   return total + numOfAdults + numOfChildren;
  // }, 0);
  let numOfChildren = 0, numOfAdults = 0;
  guestOccupancy.map(guest => {
    numOfAdults += guest?.num_of_adults;
    numOfChildren += guest?.num_of_children;
  });

  return numOfAdults + numOfChildren;
};

export const extractDateTimeCheckout = (dateTimeString) => {
  // Create a Date object from the given ISO string
  const dateObj = new Date(dateTimeString);

  // Extract the date in YYYY-MM-DD format
  const date = dateObj.toISOString().split('T')[0];

  // Extract the time in HH:MM:SS format
  const time = dateObj.toISOString().split('T')[1].split('.')[0];

  // Return both date and time
  return { date, time };
}

export const calculateAmounts = (data) => {
  // Parse values from strings to numbers
  const roomAmount = parseFloat(data.roomAmount);
  const gst = parseFloat(data.gst);
  const anyDiscountAmt = parseFloat(data.anyDiscountAmt);
  const advanceAmount = parseFloat(data.advanceAmount);
  const paymentAmount = parseFloat(data.paymentAmount);
  

  // Calculate Total Amount Payable
  const totalAmountPayable = roomAmount + gst - anyDiscountAmt;

  // Calculate Already Paid
  const alreadyPaid = advanceAmount + paymentAmount;

  // Calculate Balance Payment
  const balancePayment = totalAmountPayable - alreadyPaid;

  // Return the calculated values
  return {
    totalAmountPayable: totalAmountPayable.toFixed(2), // Rounded to 2 decimal places
    alreadyPaid: alreadyPaid.toFixed(2),               // Rounded to 2 decimal places
    balancePayment: balancePayment.toFixed(2)          // Rounded to 2 decimal places
  };
}