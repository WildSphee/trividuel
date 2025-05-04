export default function UserCard({ name, elo }) {
    return (
      <div className="flex flex-col items-center p-4 rounded-xl shadow-md bg-gradient-to-br from-slate-50 to-slate-100 w-48">
        <img src="/avatar.svg" alt="avatar" className="h-16 w-16 mb-2" />
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-600">ELO {elo}</p>
      </div>
    );
  }