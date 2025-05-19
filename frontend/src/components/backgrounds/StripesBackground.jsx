
export default function StripesBackground() {

    return (
        <>
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="min-w-[200vw] min-h-[200vh] animate-spotlight-spin
                        bg-[repeating-conic-gradient(black_0deg,black_10deg,white_10deg,white_20deg)]
                        opacity-20 rounded-full mask-hole" />
            </div>
        </>
    )
}
