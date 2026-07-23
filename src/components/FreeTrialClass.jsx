import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { GraduationCap, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";


export default function FreeTrialClass() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({

    studentName: "",
    grade: "",
    subjects: [],

    parentName: "",
    whatsapp: "",
    alternativePhone: "",

    preferredDays: [],
    preferredTime: "",

    goals: [],

    consent: false,

  });


  const [error, setError] = useState("");



  const grades = [
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "JHS 1 (Year 7)",
    "JHS 2 (Year 8)",
    "JHS 3 (Year 9)",
    "SHS 1 (Year 10)",
    "SHS 2 (Year 11)",
    "SHS 3 (Year 12)",
  ];


  const subjects = [
    "Mathematics",
    "English Language",
    "Science",
  ];


  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];


  const goals = [
    "Improve grades",
    "Prepare for exams (BECE/WASSCE)",
    "Catch up on missed topics",
    "Build confidence",
    "Explore StudiesMasters",
  ];



  const updateField = (field,value)=>{

    setFormData(prev=>({
      ...prev,
      [field]:value
    }));

  };




  const toggleArray = (field,value)=>{

    setFormData(prev=>({

      ...prev,

      [field]:
      prev[field].includes(value)
      ?
      prev[field].filter(item=>item!==value)
      :
      [...prev[field],value]

    }));

  };




  const toggleDay = (day)=>{


    if(
      !formData.preferredDays.includes(day)
      &&
      formData.preferredDays.length >= 3
    ){

      return;

    }


    toggleArray(
      "preferredDays",
      day
    );

  };





  const submitForm=(e)=>{

    e.preventDefault();


    if(!formData.consent){

      setError(
        "Please accept the consent before submitting."
      );

      return;

    }


    console.log(formData);


    alert(
      "Your free trial class request has been submitted!"
    );


    // Later connect API here

  };




  return (

<div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 sm:py-12">
  <motion.div
    aria-hidden="true"
    animate={{ x: [0, 30, 0], y: [0, -24, 0], scale: [1, 1.08, 1] }}
    transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
    className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl"
  />
  <motion.div
    aria-hidden="true"
    animate={{ x: [0, -30, 0], y: [0, 28, 0], scale: [1.05, 1, 1.05] }}
    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
    className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl"
  />

<motion.div
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.55, ease: "easeOut" }}
  className="relative mx-auto w-full max-w-2xl"
>


<Card className="overflow-hidden border-white/80 bg-white/95 shadow-2xl shadow-blue-950/10 backdrop-blur">


<CardHeader className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-700 px-6 py-7 text-center text-white sm:px-8">

<div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-white/15" />
<div className="absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-cyan-400/15 blur-2xl" />


<Button
variant="ghost"
className="absolute left-4 top-4 text-white hover:bg-white/10 hover:text-white"
onClick={()=>navigate(-1)}
>

<ArrowLeft />

</Button>



<motion.div
animate={{ y: [0, -4, 0] }}
transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
className="relative
mx-auto
w-16
h-16
rounded-2xl
bg-gradient-to-r
from-blue-500
to-cyan-500
flex
items-center
justify-center
">


<GraduationCap className="text-white"/>


</motion.div>



<CardTitle className="relative mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">

🎓 Book Your Free Trial Class

</CardTitle>


<p className="relative mt-2 text-blue-100">

Start Your Child's Learning Journey with StudiesMasters

</p>

<div className="relative mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-blue-100">
<span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-cyan-300" />No commitment required</span>
<span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-cyan-300" />Personalised for your child</span>
</div>


</CardHeader>





<CardContent className="p-4 sm:p-5 md:p-6">


<form
onSubmit={submitForm}
className="space-y-6"
>

<div className="flex items-center gap-3 rounded-xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 text-sm text-slate-700">
<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-sm">✦</span>
<p><strong className="text-slate-900">Free trial request:</strong> tell us a little about your child and we will confirm a suitable class time.</p>
</div>




{/* STUDENT */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-4 text-lg font-bold text-slate-900">
👨‍🎓 Student Information
</h2>


<Label>
Student Full Name *
</Label>

<Input

required

className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm shadow-sm focus-visible:ring-cyan-500"

value={formData.studentName}

onChange={(e)=>
updateField(
"studentName",
e.target.value
)
}

/>



<div className="mt-4">

<Label>
Current Grade/Class *
</Label>


<select

required

className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"

value={formData.grade}

onChange={(e)=>
updateField(
"grade",
e.target.value
)
}

>


<option value="">
Select Grade
</option>


{grades.map(g=>(

<option key={g}>
{g}
</option>

))}


</select>

</div>





<div className="mt-4">

<Label>
Subjects for Trial Class *
</Label>


<div className="space-y-2 mt-2">


{subjects.map(subject=>(

<label
key={subject}
className="block"
>

<input

type="checkbox"

checked={
formData.subjects.includes(subject)
}

onChange={()=>
toggleArray(
"subjects",
subject
)
}

/>

{" "}

{subject}


</label>


))}


</div>

</div>


</section>






{/* PARENT */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-4 text-lg font-bold text-slate-900">
👨‍👩‍👧 Parent / Guardian Information
</h2>


<Label>
Parent Full Name *
</Label>


<Input

required

value={formData.parentName}

onChange={(e)=>
updateField(
"parentName",
e.target.value
)
}

/>


<div className="mt-4">

<Label>
WhatsApp Number *
</Label>


<Input

required

value={formData.whatsapp}

onChange={(e)=>
updateField(
"whatsapp",
e.target.value
)
}

/>

</div>



<div className="mt-4">

<Label>
Alternative Contact Number
</Label>


<Input

value={formData.alternativePhone}

onChange={(e)=>
updateField(
"alternativePhone",
e.target.value
)
}

/>

</div>


</section>







{/* SCHEDULE */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-3 text-lg font-bold text-slate-900">
🕒 Trial Class Preferences
</h2>



<p className="text-sm text-gray-500">
Choose up to 3 days only
</p>


<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">


{days.map(day=>(

<label key={day}>


<input

type="checkbox"

checked={
formData.preferredDays.includes(day)
}

onChange={()=>
toggleDay(day)
}

/>

{" "}

{day}


</label>


))}


</div>




<div className="mt-5">

<Label>
Preferred Time *
</Label>


<select

required

className="w-full rounded-lg border p-2.5"

value={formData.preferredTime}

onChange={(e)=>
updateField(
"preferredTime",
e.target.value
)
}

>


<option value="">
Select Time
</option>

<option>
Morning
</option>

<option>
Afternoon
</option>

<option>
Evening
</option>


</select>


</div>


</section>







{/* GOALS */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-3 text-lg font-bold text-slate-900">

🎯 Main Goal (Optional)

</h2>



{goals.map(goal=>(


<label
key={goal}
className="block"
>


<input

type="checkbox"

checked={
formData.goals.includes(goal)
}

onChange={()=>
toggleArray(
"goals",
goal
)
}

/>

{" "}

{goal}


</label>


))}


</section>






{/* CONSENT */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-3 text-lg font-bold text-slate-900">

📍 Consent

</h2>


<label>


<input

type="checkbox"

checked={formData.consent}

onChange={(e)=>
updateField(
"consent",
e.target.checked
)
}

/>


{" "}

I agree to be contacted via WhatsApp and phone regarding the trial class.


</label>


</section>




{error && (

<p className="text-red-600">
{error}
</p>

)}




<Button

type="submit"

className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 py-5 text-lg font-bold shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-cyan-700"

>


🟢 BOOK MY FREE TRIAL CLASS


</Button>



</form>


</CardContent>


</Card>


</motion.div>
</div>


  );

}
