export default function MenuToast({ message = "", onClose = () => {} }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-[#2a313d] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-700">
      <span className="material-symbols-outlined text-[#4edea3] text-[22px]">
        check_circle
      </span>
      <div className="flex flex-col">
        <span className="text-xs font-bold">{message}</span>
        <span className="text-[10px] text-slate-300">
          Reflected on BiteGo Consumer App in real-time
        </span>
      </div>
      <button
        onClick={onClose}
        type="button"
        className="ml-2 text-slate-400 hover:text-white cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
