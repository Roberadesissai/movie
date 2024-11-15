
const ComingSoon = () => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-64px)]">
      <div className="container relative flex flex-col min-h-screen px-6 py-8 mx-auto">
        {/* Main Content */}
        <section className="flex items-center flex-1">
          <div className="flex flex-col w-full">
            <h1 className="text-5xl font-extrabold text-center lg:text-7xl 2xl:text-8xl">
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-blue-500 via-purple-500 to-pink-500">
                Coming
              </span>
              <span className="text-transparent bg-gradient-to-tr bg-clip-text from-pink-500 via-purple-500 to-blue-500">
                Soon
              </span>
            </h1>

            <p className="max-w-3xl mx-auto mt-6 text-lg text-center text-gray-700 dark:text-white md:text-xl">
              We&apos;re working on something awesome! Our anime section is under construction.
              Stay tuned for an amazing experience.
            </p>

            <p className="mt-8 text-center text-gray-700 dark:text-white text-md md:text-xl">
              Coming in 2024! 🚀
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ComingSoon;