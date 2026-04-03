export default function StaffHome() {
  return (
    <section id="staff-home" className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-2">Staff Dashboard</h3>
      <p className="text-sm text-gray-600">
        Here you can manage your subjects, create exams, add questions, allow students and publish results.
      </p>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card id="staff-card-sub" title="My Subjects" desc="View assigned subjects" />
        <Card id="staff-card-exam" title="Exams" desc="Create / Edit / Schedule exams" />
        <Card id="staff-card-allow" title="Allow Students" desc="Control who can attempt exams" />
      </div>
    </section>
  );
}

function Card({ id, title, desc }) {
  return (
    <div id={id} className="border rounded-xl p-4 hover:bg-gray-50 transition">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
    </div>
  );
}
