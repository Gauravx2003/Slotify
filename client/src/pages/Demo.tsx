import Header from "../components/Header";
import Footer from "../components/Footer";

const Demo = () => {
    return (
        <div className="min-h-screen bg-surface-50 font-sans text-surface-900 flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center pt-24">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-surface-900 mb-4">Demo</h1>
                    <p className="text-xl text-surface-500 font-medium">Will be added soon.</p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Demo;
