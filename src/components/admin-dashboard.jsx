// src/components/AdminDashboard.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

import {
  FaChartPie,
  FaBullhorn,
  FaUsers,
  FaCreditCard,
  FaShieldAlt,
  FaCircle,
  FaSignOutAlt,
  FaLayerGroup,
  FaBook,
} from "react-icons/fa";

import Overview from "./Admin/Overview";
import BroadcastTab from "./Admin/BroadcastTab";
import Users from "./Admin/Users";
import PaymentsTab from "./Admin/PaymentsTab";
import ClassGroups from "./Admin/ClassGroups";
import SubjectsTab from "./Admin/SubjectsTab";
import MoodleTab from "./Admin/MoodleTab";
import AdminVirtualOps from "./virtual/AdminVirtualOps.jsx";
import NotificationBell from "./Admin/NotificationItem";



/*
|--------------------------------------------------------------------------
| API URL
|--------------------------------------------------------------------------
*/

const BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  (
    import.meta.env.DEV
      ? "http://localhost:5000"
      : "https://studiesmasters-backend.onrender.com"
  )
).replace(/\/$/, "");




/*
|--------------------------------------------------------------------------
| Currency Formatter
|--------------------------------------------------------------------------
*/

export const formatMoney = (amount) => {

  return new Intl.NumberFormat(
    "en-GH",
    {
      style: "currency",
      currency: "GHS",
    }
  ).format(
    Number(amount || 0)
  );

};





/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
*/


export default function AdminDashboard({
  onLogout
}) {


  const navigate = useNavigate();



  const [activeTab,setActiveTab] =
    useState("overview");


  const [notifications,setNotifications] =
    useState([]);



  const [recentMessage,setRecentMessage] =
    useState(null);



  const [user,setUser] =
    useState({});





/*
|--------------------------------------------------------------------------
| Get Admin User From Token
|--------------------------------------------------------------------------
*/


useEffect(()=>{


  const token =
    localStorage.getItem(
      "adminToken"
    );



  if(!token){

    navigate(
      "/admin-login",
      {
        replace:true
      }
    );

    return;

  }



  try{


    const decoded =
      jwtDecode(token);



    const expiresAt =
      decoded.exp
      ? decoded.exp * 1000
      : 0;



    const validRole =
      [
        "MAIN_ADMIN",
        "MINOR_ADMIN"
      ].includes(
        decoded.role
      );




    if(
      !validRole ||
      expiresAt <= Date.now()
    ){


      localStorage.removeItem(
        "adminToken"
      );


      navigate(
        "/admin-login",
        {
          replace:true
        }
      );


      return;

    }




    setUser({

      _id:
        decoded.id,

      role:
        decoded.role,

    });




  }catch(error){


    console.error(
      "Invalid admin token",
      error
    );


    localStorage.removeItem(
      "adminToken"
    );


    navigate(
      "/admin-login",
      {
        replace:true
      }
    );


  }



},[navigate]);







/*
|--------------------------------------------------------------------------
| Socket Connection
|--------------------------------------------------------------------------
*/


useEffect(()=>{


  if(!user?._id)
    return;



  let socket;



  try{


    socket =
      io(
        BASE_URL,
        {

          withCredentials:true,

          query:{
            userId:user._id
          }

        }
      );




    socket.on(
      "connect",
      ()=>{

        console.log(
          "Admin connected:",
          socket.id
        );

      }
    );





    socket.on(
      "message:new",
      (data)=>{

        addNotification(
          `New message from ${
            data.senderName ||
            "Teacher"
          }`
        );

      }
    );





    socket.on(
      "broadcast:new",
      (data)=>{


        addNotification(
          `New broadcast: ${
            data.subject ||
            "General"
          }`
        );


      }
    );






    socket.on(
      "payment:new",
      (data)=>{


        addNotification(
          `New payment submitted by ${
            data.studentName ||
            "Student"
          }`
        );


      }
    );






    socket.on(
      "disconnect",
      ()=>{

        console.log(
          "Socket disconnected"
        );

      }
    );





  }catch(error){


    console.error(
      "Socket connection error:",
      error
    );


  }





  return()=>{


    if(socket){

      socket.disconnect();

    }


  };



},[user?._id]);







/*
|--------------------------------------------------------------------------
| Notifications
|--------------------------------------------------------------------------
*/


const addNotification =
(message)=>{


  const notification = {

    id:
      Date.now(),

    message,

    time:
      new Date()
      .toLocaleTimeString()

  };



  setNotifications(
    previous=>[
      notification,
      ...previous
    ]
  );



  setRecentMessage(
    message
  );



  setTimeout(()=>{


    setRecentMessage(
      null
    );


  },5000);



};







/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/


const handleLogout = ()=>{


  localStorage.removeItem(
    "adminToken"
  );


  if(onLogout){

    onLogout();

  }



  window.location.href =
    "/admin-login";


};







/*
|--------------------------------------------------------------------------
| Tabs
|--------------------------------------------------------------------------
*/


const tabs = [

  {
    id:"overview",
    label:"Overview",
    icon:FaChartPie
  },


  {
    id:"broadcast",
    label:"Broadcasts",
    icon:FaBullhorn
  },


  {
    id:"users",
    label:"Users",
    icon:FaUsers
  },


  {
    id:"payments",
    label:"Payments",
    icon:FaCreditCard
  },


  {
    id:"class-groups",
    label:"Class Groups",
    icon:FaLayerGroup
  },

  {
    id:"subjects",
    label:"Subjects",
    icon:FaBook
  },


  {
    id:"moodle",
    label:"Moodle",
    icon:FaShieldAlt
  },

  {
    id:"virtual",
    label:"Virtual Ops",
    icon:FaChartPie
  }


];


/*
|--------------------------------------------------------------------------
| Render Content Based On Active Tab
|--------------------------------------------------------------------------
*/

const renderContent = () => {

  switch(activeTab){

    case "overview":
      return <Overview/>;

    case "broadcast":
      return <BroadcastTab/>;

    case "users":
      return <Users/>;

    case "payments":
      return <PaymentsTab/>;

    case "class-groups":
      return <ClassGroups/>;

    case "subjects":
      return <SubjectsTab/>;

    case "moodle":
      return <MoodleTab/>;

    case "virtual":
      return <AdminVirtualOps/>;

    default:
      return <Overview/>;

  }

};


// ================= RENDER =================

return (

<div className="
min-h-screen
bg-slate-100
text-slate-900
">


<div className="
mx-auto
flex
min-h-screen
max-w-[1600px]
">





{/* ================= DESKTOP SIDEBAR ================= */}


<aside className="
hidden
w-72
shrink-0
flex-col
bg-slate-950
p-5
text-slate-300
lg:flex
">


<div className="
flex
items-center
gap-3
border-b
border-slate-800
pb-6
px-2
">


<div className="
flex
h-11
w-11
items-center
justify-center
rounded-xl
bg-gradient-to-br
from-blue-500
to-indigo-600
text-white
shadow-lg
">


<FaShieldAlt/>


</div>



<div>

<p className="
font-bold
text-white
tracking-tight">

StudiesMasters

</p>


<p className="
text-xs
text-slate-500">

Administration Portal

</p>


</div>


</div>





<p className="
mt-7
px-3
text-xs
font-bold
uppercase
tracking-[0.18em]
text-slate-500
">

Workspace

</p>





<nav className="
mt-3
space-y-1
">


{tabs.map(
({
id,
label,
icon:Icon
})=>(


<button

key={id}

onClick={()=>
setActiveTab(id)
}

className={`

flex
w-full
items-center
gap-3
rounded-xl
px-3
py-3
text-left
text-sm
font-semibold
transition

${
activeTab===id

?

"bg-blue-600 text-white shadow-lg shadow-blue-950/30"

:

"hover:bg-slate-800 hover:text-white"

}

`}


>


<Icon className="
text-base
"/>


{label}


</button>


))


}


</nav>






{/* LIVE STATUS */}


<div className="
mt-auto
rounded-xl
border
border-slate-800
bg-slate-900
p-4
">


<div className="
flex
items-center
gap-2
text-xs
font-semibold
text-emerald-400
">


<FaCircle className="
text-[8px]
"/>


Live updates enabled


</div>



<p className="
mt-2
text-xs
leading-5
text-slate-500
">


Messages, broadcasts and payments
will appear instantly.


</p>



</div>





</aside>









{/* ================= MAIN AREA ================= */}



<main className="
min-w-0
flex-1
p-4
sm:p-6
lg:p-8
">








{/* ================= HEADER ================= */}



<header className="
mb-6
flex
flex-col
gap-4
rounded-2xl
border
border-slate-200
bg-white
px-5
py-4
shadow-sm

sm:flex-row
sm:items-center
sm:justify-between
">


<div>


<p className="
text-xs
font-bold
uppercase
tracking-[0.16em]
text-blue-600
">

Admin Workspace

</p>



<h1 className="
mt-1
text-2xl
font-bold
tracking-tight
text-slate-900

sm:text-3xl
">


Admin Dashboard


</h1>




<p className="
mt-1
text-sm
text-slate-500
">

Manage your learning community
from one place.

</p>



</div>







<div className="
flex
items-center
justify-between
gap-4

sm:justify-end
">





{/* NOTIFICATIONS */}
<NotificationBell />


{/* PROFILE */}


<div className="
flex
items-center
gap-3
">


<div className="
flex
h-10
w-10
items-center
justify-center
rounded-full
bg-blue-50
font-bold
text-blue-700
ring-4
ring-blue-50
">


{
user?.role
?.charAt(0)
?.toUpperCase()
||
"A"
}


</div>




<div className="
hidden
sm:block
">


<p className="
text-sm
font-semibold
capitalize
text-slate-800
">

{
user?.role ||
"Administrator"
}


</p>


<p className="
text-xs
text-slate-500
">

Secure session

</p>


</div>


</div>







{/* LOGOUT */}


<button

onClick={handleLogout}

className="
inline-flex
items-center
gap-2
rounded-lg
border
border-rose-200
px-3
py-2
text-sm
font-semibold
text-rose-700
transition
hover:bg-rose-50
">


<FaSignOutAlt/>


<span className="
hidden
sm:inline
">

Logout

</span>


</button>






</div>


</header>









{/* ================= MOBILE TAB NAV ================= */}



<nav className="
mb-6
flex
gap-2
overflow-x-auto
rounded-xl
border
border-slate-200
bg-white
p-2
shadow-sm

lg:hidden
">


{
tabs.map(
({
id,
label,
icon:Icon
})=>(


<button

key={id}

onClick={()=>
setActiveTab(id)
}


className={`

inline-flex
shrink-0
items-center
gap-2
rounded-lg
px-3
py-2
text-sm
font-semibold
transition

${
activeTab===id

?

"bg-blue-600 text-white"

:

"text-slate-600 hover:bg-slate-100"

}

`}


>


<Icon/>


{label}


</button>



))


}



</nav>









{/* ================= LIVE MESSAGE ================= */}



{
recentMessage && (


<div className="
mb-6
flex
items-center
gap-3
rounded-xl
border
border-emerald-200
bg-emerald-50
px-4
py-3
text-emerald-900
shadow-sm
">


<span className="
h-2
w-2
rounded-full
bg-emerald-500
"/>



<p className="
text-sm
font-medium
">


{recentMessage}


</p>



</div>


)

}

{/* ================= CONTENT AREA ================= */}

<div className="
rounded-2xl
border
border-slate-200
bg-white
shadow-sm
overflow-hidden
">

{renderContent()}

</div>


</main>

</div>

</div>

);

}