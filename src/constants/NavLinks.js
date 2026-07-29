import { FaBuildingCircleCheck } from "react-icons/fa6";
import { BsBookmarkCheckFill, BsBookmarkXFill } from "react-icons/bs";
import { MdDashboard } from "react-icons/md";

const NavLinks = [
  {
    title: "Dashboard",
    route: "/",
    icon: MdDashboard,
    alt: "Home Icon",
  },
  {
    title: "Room Map",
    route: "/room-map",
    icon: FaBuildingCircleCheck,
    alt: "Room Map Icon",
  },
  // {
  //   title: "Check In",
  //   route: "/check-in",
  //   icon: BsBookmarkCheckFill,
  //   alt: "Check In Icon",
  // },
  {
    title: "Check Out",
    route: "/check-out",
    icon: BsBookmarkXFill,
    alt: "Check Out Icon",
  }
];

export default NavLinks;