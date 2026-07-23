import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const INCLUDED_SUBJECTS = ["English", "Maths", "Science"];

export function StudentRegistrationForm() {
  const navigate = useNavigate();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL ||
    "https://studiesmasters-backend.onrender.com";


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const [formData, setFormData] = useState({

    // Student
    studentName: "",
    curriculum: "GES",
    grade: "",


    // Parent
    parentName: "",
    relationship: "",
    mobile: "",
    whatsapp: "",
    email: "",


    // Academic
    performance: "",
    goals: [],
    // Learning Plan
    plan: "",
    addOns: [],


    // Schedule
    preferredDays: [],
    preferredTime: "",


    // Other
    additionalInfo: "",


    // Policy acceptance
    acceptTerms: false,
    acceptPrivacy: false,
    acceptParentAgreement: false,

  });



  const grades = {

    GES: [
      
      "Primary 4",
      "Primary 5",
      "Primary 6",
      "JHS 1",
      "JHS 2",
      "JHS 3",
      "SHS 1",
      "SHS 2",
      "SHS 3",
    ],


    CAMBRIDGE: [
    
      "Grade 4",
      "Grade 5",
      "Grade 6",
      "Grade 7",
      "Grade 8",
      "Grade 9",
    ],

  };



  const plans = {

    GES: [
      {
        name: "Starter Plan",
        price: 250,
      },
      {
        name: "Standard Plan",
        price: 500,
      },
      {
        name: "Premium Plan",
        price: 900,
      },
      {
        name: "Recommend a Plan",
        price: 0,
      },
    ],



    CAMBRIDGE: [
      {
        name: "Starter Plan",
        price: 450,
      },
      {
        name: "Standard Plan",
        price: 760,
      },
      {
        name: "Premium Plan",
        price: 1200,
      },
      {
        name: "Recommend a Plan",
        price: 0,
      },
    ],

  };



  const addOns = {

    GES: [
      {
        name: "Homework Club",
        price: 250,
      },
      {
        name: "Exams Boost Camp (BECE/WASSCE/NOVDEC)",
        price: 500,
      },
    ],


    CAMBRIDGE: [
      {
        name: "Homework Club",
        price: 300,
      },
      {
        name: "Exams Boost",
        price: 300,
      },
      {
        name: "IGCSE Booster Camp",
        price: 900,
      },
      {
        name: "1 on 1 Private Coaching",
        price: 3600,
      },
    ],

  };



  const calculateTotal = () => {

    let total = 0;


    const selectedPlan =
      plans[formData.curriculum].find(
        (item) => item.name === formData.plan
      );


    if(selectedPlan){
      total += selectedPlan.price;
    }



    formData.addOns.forEach((addon)=>{

      const item =
        addOns[formData.curriculum].find(
          (a)=>a.name === addon
        );


      if(item){
        total += item.price;
      }

    });


    return total;

  };



  const totalAmount = calculateTotal();

  // The plan chosen in the form is the student's package. Previously this was
  // hard-coded to `${curriculum}-EC`, so every welcome email showed EC.
  const backendPackage = formData.plan;
  const backendGrade = formData.grade;



  const updateField = (field,value)=>{

    setFormData((prev)=>({
      ...prev,
      [field]:value
    }));

  };



  const handleGoalChange=(goal)=>{

    setFormData((prev)=>({

      ...prev,

      goals:
      prev.goals.includes(goal)
      ?
      prev.goals.filter((g)=>g!==goal)
      :
      [...prev.goals,goal]

    }));

  };



  const handleAddonChange=(addon)=>{

    setFormData((prev)=>({

      ...prev,

      addOns:
      prev.addOns.includes(addon)
      ?
      prev.addOns.filter((a)=>a!==addon)
      :
      [...prev.addOns,addon]

    }));

  };


  const handleDayChange=(day)=>{


    if(
      !formData.preferredDays.includes(day)
      &&
      formData.preferredDays.length >=3
    ){

      return;

    }


    setFormData((prev)=>({

      ...prev,

      preferredDays:
      prev.preferredDays.includes(day)
      ?
      prev.preferredDays.filter((d)=>d!==day)
      :
      [...prev.preferredDays,day]

    }));

  };
    const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.acceptTerms || !formData.acceptPrivacy || !formData.acceptParentAgreement) {
      setError("Please confirm the required consent and policy acceptance options before continuing.");
      return;
    }

    if (!formData.plan) {
      setError("Please select a learning plan.");
      return;
    }

    if (formData.preferredDays.length !== 3) {
      setError("Please select exactly 3 learning days each week.");
      return;
    }


    setLoading(true);


    try {

      const payload = {
        fullName: formData.studentName,
        email: formData.email,
        phone: formData.mobile,
        curriculum: formData.curriculum,
        package: backendPackage,
        grade: backendGrade,
        subjects: INCLUDED_SUBJECTS,
        selectedPlan: formData.plan,
        totalAmount,
        preferredDays: formData.preferredDays,
        preferredTime: formData.preferredTime,
        policyAcceptance: {
          terms: formData.acceptTerms,
          privacy: formData.acceptPrivacy,
          parentAgreement: formData.acceptParentAgreement,
        },
      };


      const response = await fetch(
        `${BACKEND_URL}/api/students/register`,
        {
          method: "POST",
          headers:{
            "Content-Type":"application/json",
          },

          body:JSON.stringify(payload),
        }
      );


      const data = await response.json();


      if(!response.ok){
        throw new Error(
          data.message || "Registration failed"
        );
      }



      navigate("/payment",{

        state:{
          student:data.user || formData,
          curriculum:formData.curriculum,
          grade: backendGrade,
          package: formData.plan,
          plan:formData.plan,
          subjects: INCLUDED_SUBJECTS.map((name) => ({ _id: name, name })),
          addOns:formData.addOns,
          preferredDays: formData.preferredDays,
          preferredTime: formData.preferredTime,
          totalAmount,
          welcomeEmail: data.welcomeEmail,
        }

      });



    }catch(err){

      console.error(err);

      setError(
        err.message === "Email already registered"
          ? "This email already has an account. Please sign in, or use a different email address to register a new student."
          : err.message
      );

    }finally{

      setLoading(false);

    }

  };



  return (

    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 sm:py-12">
      <motion.div
        aria-hidden="true"
        animate={{ x: [0, 35, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-cyan-200/50 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-2xl"
      >
      <Card className="overflow-hidden border-white/80 bg-white/95 shadow-2xl shadow-blue-950/10 backdrop-blur">


        <CardHeader className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 px-6 py-7 text-center text-white sm:px-8">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-white/15" />
          <div className="absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-cyan-400/15 blur-2xl" />

          <Button
            variant="ghost"
            size="sm"
            onClick={()=>navigate(-1)}
            className="absolute left-4 top-4 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4"/>
          </Button>


          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative
          w-16 h-16 mx-auto
          rounded-2xl
          bg-gradient-to-br
          from-cyan-400
          to-blue-500
          flex items-center justify-center
          shadow-lg shadow-cyan-400/30
          ">

            <GraduationCap
              className="text-white"
            />

          </motion.div>


          <CardTitle className="relative mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            StudiesMasters Student Registration
          </CardTitle>


          <CardDescription className="relative mt-2 text-blue-100">
            Start Your Child's Learning Journey
          </CardDescription>

          <div className="relative mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-cyan-300" />Personalised learning</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-cyan-300" />Secure registration</span>
          </div>


        </CardHeader>



        <CardContent className="p-4 sm:p-5 md:p-6">


        {error && (

          <p className="text-red-600 text-center mb-4">
            {error}
          </p>

        )}



<form 
onSubmit={handleSubmit}
className="space-y-6"
>

<div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-slate-700">
  <div className="flex items-start gap-3">
    <span className="mt-0.5 rounded-lg bg-blue-600 p-1.5 text-white"><Sparkles className="h-4 w-4" /></span>
    <p><strong className="text-slate-900">A quick start:</strong> Complete the details below and our academic team will use them to recommend the best learning plan.</p>
  </div>
</div>



{/* ================= STUDENT INFORMATION ================= */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">

<h2 className="mb-4 text-lg font-bold text-slate-900">
Student Information
</h2>


<InputField

label="Student Full Name"

value={formData.studentName}

onChange={(v)=>
updateField("studentName",v)
}

/>



<div className="mt-4">

<Label>
Curriculum
</Label>


<select

className="w-full border rounded-lg p-2"

value={formData.curriculum}

onChange={(e)=>{

updateField(
"curriculum",
e.target.value
);

updateField(
"grade",
""
);

updateField(
"plan",
""
);

updateField(
"addOns",
[]
);

}}

>


<option value="GES">
GES
</option>


<option value="CAMBRIDGE">
Cambridge
</option>


</select>


</div>




<div className="mt-4">


<Label>
Current Grade/Class/Year
</Label>


<select

required

className="w-full border rounded-lg p-2"

value={formData.grade}

onChange={(e)=>{
updateField("grade", e.target.value);
}}

>


<option value="">
Select Grade
</option>


{
grades[formData.curriculum]
.map((grade)=>(

<option
key={grade}
value={grade}
>

{grade}

</option>


))
}


</select>


</div>


</section>






{/* ================= PARENT INFORMATION ================= */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-4 text-lg font-bold text-slate-900">
Parent / Guardian Information
</h2>


<InputField

label="Parent / Guardian Full Name"

value={formData.parentName}

onChange={(v)=>
updateField(
"parentName",
v
)
}

/>



<div className="mt-4">

<Label>
Relationship
</Label>


<select

className="w-full border rounded-lg p-2"

value={formData.relationship}

onChange={(e)=>
updateField(
"relationship",
e.target.value
)
}

>


<option value="">
Select Relationship
</option>

<option>
Mother
</option>

<option>
Father
</option>

<option>
Guardian
</option>

<option>
Other
</option>


</select>


</div>




<InputField

label="Mobile Number"

value={formData.mobile}

onChange={(v)=>
updateField(
"mobile",
v
)
}

/>



<InputField

label="WhatsApp Number"

value={formData.whatsapp}

onChange={(v)=>
updateField(
"whatsapp",
v
)
}

/>



<InputField

label="Email Address"

type="email"

value={formData.email}

onChange={(v)=>
updateField(
"email",
v
)
}

/>

</section>






{/* ================= ACADEMIC ================= */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-4 text-lg font-bold text-slate-900">
Academic Support Needed
</h2>



<Label>
Current Academic Performance
</Label>


<select

className="w-full border rounded-lg p-2"

value={formData.performance}

onChange={(e)=>
updateField(
"performance",
e.target.value
)
}

>


<option value="">
Select Performance
</option>

<option>
Excellent (80%+)
</option>

<option>
Good (70-79%)
</option>

<option>
Average (60-69%)
</option>

<option>
Needs Improvement (Below 60%)
</option>

<option>
Not Sure
</option>


</select>



<h3 className="font-semibold mt-5 mb-2">
Learning Goals
</h3>


{
[
"Improve grades",
"Prepare for exams",
"Catch up on missed work",
"Build confidence",
"Get ahead academically",
"Other"
]
.map((goal)=>(

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
handleGoalChange(goal)
}

/>

{" "}

{goal}


</label>


))
}


</section>
{/* ================= LEARNING PLAN ================= */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-4 text-lg font-bold text-slate-900">
Select a Learning Plan ({formData.curriculum})
</h2>



<div className="grid md:grid-cols-2 gap-4">


{
plans[formData.curriculum].map((item)=>(


<label

key={item.name}

className={`
border rounded-xl p-4 cursor-pointer
transition
${
formData.plan === item.name
?
"border-blue-500 bg-blue-50"
:
""
}
`}

>


<input

type="radio"

name="plan"

value={item.name}

checked={
formData.plan === item.name
}

onChange={(e)=>{
updateField("plan", e.target.value);
}}

/>


<span className="ml-2 font-semibold">

{item.name}

</span>



{
item.price > 0 && (

<p className="text-sm text-gray-600 ml-5">

GHS {item.price}/month

</p>

)

}



{
item.name === "Standard Plan" && (

<span className="text-xs text-green-600 ml-5">

 Most Popular

</span>

)

}


</label>


))

}


</div>


</section>







{/* ================= ADDONS ================= */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-4 text-lg font-bold text-slate-900">

Add Ons

</h2>



<div className="space-y-3">


{
addOns[formData.curriculum].map((addon)=>(


<label

key={addon.name}

className="flex items-center gap-2"

>


<input

type="checkbox"

checked={
formData.addOns.includes(
addon.name
)
}

onChange={()=> 
handleAddonChange(
addon.name
)
}

/>


<span>

{addon.name}

-
GHS {addon.price}/month

</span>


</label>


))

}


</div>


</section>








{/* ================= SCHEDULE ================= */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-4 text-lg font-bold text-slate-900">

Preferred Learning Schedule

</h2>




<p className="text-sm text-gray-600 mb-3">

Choose exactly 3 days each week ({formData.preferredDays.length}/3 selected)

</p>



<div className="grid grid-cols-2 md:grid-cols-4 gap-3">


{

[
"Monday",
"Tuesday",
"Wednesday",
"Thursday",
"Friday",
"Saturday",
"Sunday"
]

.map((day)=>(


<label

key={day}

className="flex gap-2 items-center"

>


<input

type="checkbox"

disabled={
  !formData.preferredDays.includes(day) &&
  formData.preferredDays.length >= 3
}

checked={
formData.preferredDays.includes(day)
}

onChange={()=>handleDayChange(day)}

 />


{day}


</label>


))


}


</div>





<div className="mt-5">


<Label>
Preferred Time
</Label>



<select

className="w-full border rounded-lg p-2"

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
Afternoon
</option>


<option>
Evening
</option>


<option>
Weekend Only
</option>


<option>
Flexible
</option>


</select>


</div>


</section>









{/* ================= ADDITIONAL INFORMATION ================= */}


<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">


<h2 className="mb-4 text-lg font-bold text-slate-900">

Additional Information

</h2>



<textarea

className="
w-full
border
rounded-lg
p-3
min-h-[80px]
"

placeholder="
Tell us anything we should know about your child.

Examples:
- Areas of difficulty
- Exam preparation needs
- Special learning requirements
"

value={
formData.additionalInfo
}

onChange={(e)=>
updateField(
"additionalInfo",
e.target.value
)
}


/>


</section>










{/* ================= CONSENT & ACCEPTANCE ================= */}

<section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
  <h2 className="mb-4 text-lg font-bold text-slate-900">Consent &amp; Acceptance</h2>
<div className="mt-5 border-t border-slate-200 pt-4">
  <p className="mb-3 text-sm font-semibold text-slate-800">Consent &amp; Acceptance <span className="text-red-600">*</span></p>

  <label className="flex gap-2 items-start text-sm">
    <input
      type="checkbox"
      required
      checked={formData.acceptTerms}
      onChange={(e) => updateField("acceptTerms", e.target.checked)}
    />
    <span>I have read and accept the <a className="text-blue-700 underline" href="/policies" target="_blank" rel="noreferrer">Terms &amp; Conditions</a>.</span>
  </label>

  <label className="mt-3 flex gap-2 items-start text-sm">
    <input
      type="checkbox"
      required
      checked={formData.acceptPrivacy}
      onChange={(e) => updateField("acceptPrivacy", e.target.checked)}
    />
    <span>I have read and accept the <a className="text-blue-700 underline" href="/policies" target="_blank" rel="noreferrer">Privacy Policy</a>.</span>
  </label>

  <label className="mt-3 flex gap-2 items-start text-sm">
    <input
      type="checkbox"
      required
      checked={formData.acceptParentAgreement}
      onChange={(e) => updateField("acceptParentAgreement", e.target.checked)}
    />
    <span>I have read and accept the <a className="text-blue-700 underline" href="/policies" target="_blank" rel="noreferrer">Parent Service Agreement</a>.</span>
  </label>
</div>


</section>









{/* ================= PAYMENT SUMMARY ================= */}


<section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-5">


<h2 className="mb-3 text-lg font-bold text-slate-900">

Payment Summary

</h2>



<div className="space-y-2">


<p>

Curriculum:

<strong className="ml-2">

{formData.curriculum}

</strong>

</p>




<p>

Plan:

<strong className="ml-2">

{
formData.plan || "Not selected"
}

</strong>

</p>




<p>

Add-ons:

<strong className="ml-2">

{
formData.addOns.length > 0
?
formData.addOns.join(", ")
:
"None"
}

</strong>

</p>



<hr />



<p className="text-xl font-bold">

Total:

GHS {totalAmount}/month

</p>


</div>


</section>







          <Button

type="submit"

disabled={loading}

            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 py-6 text-lg font-bold shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-cyan-700"

>


{
loading
?
"Submitting Registration..."
:
"REGISTER NOW"
}


</Button>




</form>


</CardContent>


      </Card>
      </motion.div>


    </div>


);

}
function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {

  return (

    <div className="space-y-2">


      <Label>
        {label}
      </Label>


      <Input

        type={type}

        value={value}

        placeholder={placeholder}

        required

        onChange={(e)=>
          onChange(
            e.target.value
          )
        }

      />


    </div>

  );

}
