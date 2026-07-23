// src/pages/PaymentFlow.jsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, WalletCards } from "lucide-react";

import { formatCurrency } from "../utils/formatCurrency";


const BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://studiesmasters-backend.onrender.com")
).replace(/\/$/, "");


const loadPaystack = () =>
  new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement("script");

    script.src = "https://js.paystack.co/v1/inline.js";

    script.onload = resolve;

    script.onerror = () =>
      reject(new Error("Unable to load Paystack checkout."));

    document.body.appendChild(script);
  });



export default function PaymentFlow() {

  const location = useLocation();
  const navigate = useNavigate();


  const paymentData =
    location.state ||
    JSON.parse(localStorage.getItem("paymentData") || "{}");


  const user =
    paymentData.user ||
    paymentData.student ||
    paymentData;



  const [receipt, setReceipt] = useState(null);
  const [plans, setPlans] = useState([]);
  const [addOns, setAddOns] = useState([]);

  const [selectedPlan, setSelectedPlan] =
    useState(
      paymentData.package ||
      paymentData.plan ||
      ""
    );


  const [selectedAddOns, setSelectedAddOns] =
    useState([]);


  const [purpose, setPurpose] =
    useState(
      () =>
        (paymentData.payments || [])
          .some(
            (payment) =>
              payment.status === "confirmed"
          )
          ? "renewal"
          : "new"
    );


  const [method, setMethod] =
    useState("mobile_money");


  const [momoNumber, setMomoNumber] =
    useState("");


  const [loading, setLoading] =
    useState(false);


  const [message, setMessage] =
    useState("");



  const studentId =
    user?._id ||
    user?.id ||
    "";



  const studentUserId =
    receipt?.userId ||
    user?.userId ||
    "";



  const curriculum =
    receipt?.curriculum ||
    paymentData.curriculum ||
    user?.curriculum ||
    "";



  const grade =
    receipt?.grade ||
    paymentData.grade ||
    user?.grade ||
    "";



  const email =
    receipt?.email ||
    user?.email ||
    "";



  const studentName =
    receipt?.fullName ||
    user?.fullName ||
    "";



  const phone =
    receipt?.phone ||
    user?.phone ||
    "";



  const subjects = useMemo(
    () =>
      (
        receipt?.subjects ||
        paymentData.subjects ||
        user?.subjectNames ||
        []
      )
        .map((item) =>
          typeof item === "string"
            ? item
            : item.name ||
              item.subjectName
        )
        .filter(Boolean),

    [
      receipt,
      paymentData.subjects,
      user?.subjectNames
    ]
  );



  const confirmedPayment =
    (paymentData.payments || [])
      .find(
        (payment) =>
          payment.status === "confirmed"
      );



  const selectedPlanData =
    plans.find(
      (item) =>
        item.name === selectedPlan
    );



  const upgradeTotal =
    (selectedPlanData?.price || 0) +
    selectedAddOns.reduce(
      (total, name) =>
        total +
        (
          addOns.find(
            (item) =>
              item.name === name
          )?.price || 0
        ),

      0
    );



  const displayedTotal =
    purpose === "renewal"
      ? Number(
          confirmedPayment?.amount || 0
        )
      : upgradeTotal;



  useEffect(() => {

    localStorage.setItem(
      "paymentData",
      JSON.stringify(paymentData)
    );

  }, [paymentData]);



  useEffect(() => {

    if (!studentId) return;


    fetch(
      `${BASE_URL}/api/students/${studentId}/payment-summary`
    )

      .then((response) =>
        response.ok
          ? response.json()
          : null
      )

      .then((data) => {

        if (data?.student) {
          setReceipt(data.student);
        }

      })

      .catch(() => {});


  }, [studentId]);



  useEffect(() => {

    if (!curriculum) return;


    fetch(
      `${BASE_URL}/api/payments/plans/${encodeURIComponent(
        curriculum
      )}`
    )

      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject()
      )

      .then((data) => {

        setPlans(
          data.plans || []
        );


        setAddOns(
          data.addOns || []
        );


        setSelectedPlan(
          (current) =>
            current ||
            data.plans?.[0]?.name ||
            ""
        );

      })

      .catch(() => {

        setMessage(
          "Unable to load your curriculum plans."
        );

      });


  }, [curriculum]);



  const verifyPayment = async (reference) => {

    setLoading(true);


    try {

      const response =
        await fetch(
          `${BASE_URL}/api/payments/paystack/verify/${encodeURIComponent(
            reference
          )}`,
          {
            method: "POST"
          }
        );


      const result =
        await response.json();



      if (!response.ok) {

        throw new Error(
          result.message ||
          "Payment verification failed."
        );

      }



      setMessage(
        "Payment confirmed. Your learning plan is active."
      );


      setTimeout(() => {

        navigate(
          "/student/dashboard",
          {
            replace: true
          }
        );

      }, 1200);


    } catch(error) {

      setMessage(
        error.message
      );


    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    const reference =
      new URLSearchParams(
        location.search
      ).get("reference");


    if (reference) {
      verifyPayment(reference);
    }


  }, [location.search]);


  const pay = async () => {

    if (
      !studentId ||
      !studentName ||
      !email ||
      !selectedPlan ||
      !subjects.length
    ) {
      setMessage(
        "Your student details are incomplete."
      );
      return;
    }


    if (
      purpose === "renewal" &&
      !confirmedPayment
    ) {
      setMessage(
        "No confirmed prior payment is available to renew."
      );
      return;
    }


    if (
      method === "mobile_money" &&
      momoNumber.replace(/\D/g, "").length < 10
    ) {
      setMessage(
        "Enter a valid mobile-money number."
      );
      return;
    }


    setLoading(true);
    setMessage("");


    try {

      const response =
        await fetch(
          `${BASE_URL}/api/payments/paystack/initialize`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },


            body: JSON.stringify({

              studentId,
              studentName,
              email,
              phone,

              curriculum,
              grade,

              package: selectedPlan,

              subjects,

              paymentPurpose: purpose,


              addOns:
                purpose === "upgrade"
                  ? selectedAddOns
                  : [],


              paymentMethod: method,


              channels:
                method === "card"
                  ? ["card"]
                  : ["mobile_money"],


              callbackUrl:
                `${window.location.origin}/payment`,


              metadata: {

                mobileMoneyNumber:
                  momoNumber.replace(/\D/g, ""),

              },

            }),
          }
        );



      const result =
        await response.json();



      if (!response.ok) {

        throw new Error(
          result.message ||
          "Unable to start Paystack checkout."
        );

      }



      await loadPaystack();



      window.PaystackPop.setup({

        key:
          result.publicKey,


        email,


        amount:
          Math.round(
            Number(result.amount) * 100
          ),


        currency:
          "GHS",


        ref:
          result.reference,


        channels:
          method === "card"
            ? ["card"]
            : ["mobile_money"],



        callback:
          ({ reference }) =>
            verifyPayment(reference),



        onClose: () => {

          setLoading(false);

          setMessage(
            "Payment window closed. No payment was taken."
          );

        },

      }).openIframe();



    } catch(error) {

      setMessage(
        error.message
      );

      setLoading(false);

    }

  };



  const toggleAddOn = (name) => {

    setSelectedAddOns(
      (current) =>
        current.includes(name)

          ? current.filter(
              (item) =>
                item !== name
            )

          : [
              ...current,
              name
            ]
    );

  };



  return (

    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">

      <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">


        <header className="bg-gradient-to-r from-slate-950 to-blue-700 px-6 py-8 text-white">

          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-blue-100"
          >
            <ArrowLeft size={16}/>
            Back
          </button>


          <h1 className="text-3xl font-bold">
            Manage your learning plan
          </h1>


          <p className="mt-2 text-blue-100">
            Renew your plan or upgrade with curriculum-specific options.
          </p>


        </header>



        <div className="grid gap-7 p-6 md:grid-cols-2">


          <section>


            <h2 className="text-lg font-bold">
              Choose an action
            </h2>



            <div className="mt-3 grid gap-2">


              <button

                onClick={() => {

                  setPurpose("renewal");

                  setSelectedAddOns([]);

                }}

                className={`rounded-xl border p-4 text-left ${
                  purpose === "renewal"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200"
                }`}
              >

                <b>
                  Renew current plan
                </b>


                <span className="mt-1 block text-sm text-slate-500">

                  Your last confirmed price:
                  {" "}
                  {formatCurrency(
                    confirmedPayment?.amount
                  )}

                </span>


              </button>



              <button

                onClick={() =>
                  setPurpose("upgrade")
                }

                className={`rounded-xl border p-4 text-left ${
                  purpose === "upgrade"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200"
                }`}
              >

                <b>
                  Upgrade plan
                </b>


                <span className="mt-1 block text-sm text-slate-500">
                  Select another package and add-ons.
                </span>


              </button>


            </div>





            <h2 className="mt-6 text-lg font-bold">

              Plans for {curriculum || "your curriculum"}

            </h2>



            <div className="mt-3 space-y-2">


              {plans.map((item)=>(


                <label

                  key={item.name}

                  className={`flex justify-between rounded-xl border p-4 ${
                    selectedPlan === item.name
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200"
                  }`}

                >


                  <span>

                    <input

                      type="radio"

                      checked={
                        selectedPlan === item.name
                      }

                      disabled={
                        purpose === "renewal"
                      }

                      onChange={() =>
                        setSelectedPlan(
                          item.name
                        )
                      }

                      className="mr-2 accent-blue-600"

                    />


                    {item.name}


                    <small className="ml-2 text-slate-500">

                      {item.duration}

                    </small>


                  </span>



                  <b>
                    {formatCurrency(
                      item.price
                    )}
                  </b>


                </label>


              ))}


            </div>




            {purpose === "upgrade" && (

              <>

              <h2 className="mt-6 text-lg font-bold">
                Optional add-ons
              </h2>


              <div className="mt-3 space-y-2">


              {addOns.map((item)=>(

                <label

                  key={item.name}

                  className="flex justify-between rounded-xl border border-slate-200 p-3"

                >

                  <span>

                    <input

                      type="checkbox"

                      checked={
                        selectedAddOns.includes(
                          item.name
                        )
                      }

                      onChange={() =>
                        toggleAddOn(
                          item.name
                        )
                      }

                      className="mr-2"

                    />

                    {item.name}

                  </span>



                  <b>

                    {formatCurrency(
                      item.price
                    )}

                  </b>


                </label>


              ))}


              </div>


              </>

            )}


          </section>





          <section className="h-fit rounded-2xl bg-slate-50 p-5">


            <h2 className="text-lg font-bold">
              Secure Paystack checkout
            </h2>



            <div className="mt-4 space-y-3 text-sm">


              <p>
                <span className="text-slate-500">
                  Student:
                </span>
                <br/>
                <b>
                  {studentName || "Loading..."}
                </b>
              </p>



              <p>
                <span className="text-slate-500">
                  Plan:
                </span>
                <br/>

                <b>
                {
                  purpose === "renewal"
                  ? confirmedPayment?.package
                  : selectedPlan
                }
                </b>

              </p>



              <p>

                <span className="text-slate-500">
                  Total due:
                </span>


                <br/>


                <b className="text-3xl">

                  {formatCurrency(
                    displayedTotal
                  )}

                </b>


              </p>


            </div>




            <button

              onClick={pay}

              disabled={
                loading ||
                !displayedTotal
              }

              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-50"

            >

              <WalletCards size={19}/>


              {
                loading
                ? "Preparing payment..."
                : `Pay ${formatCurrency(displayedTotal)} with Paystack`
              }


            </button>



            <p className="mt-4 flex gap-2 text-xs text-slate-500">

              <LockKeyhole size={16}/>

              Final amount is verified by the server.

            </p>



          </section>


        </div>




        {message && (

          <p className="mx-6 mb-6 rounded-xl bg-blue-50 p-4 text-center text-sm text-blue-900">

            {message}

          </p>

        )}



      </section>


    </main>

  );

}