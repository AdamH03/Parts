import Navbar from "@/components/Navbar";
import AdminNav from "@/components/APNav";
import ReviewsList from "@/components/ReviewsList";
import {prisma} from "@/lib/prisma";
import Footer from "@/components/Footer";

export default async function ReviewsPage() {

    const reviews = await prisma.review.findMany();

    return (
        <>
            <Navbar/>
            <AdminNav/>
            <div className="mx-auto min-h-[calc(100vh-11em)] px-6 py-12 bg-gradient-to-b from-blue-200 dark:from-blue-950 text-white">
            <div className="bg-white dark:bg-gray-800 text-black dark:text-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
                    <ReviewsList reviews={reviews} />
                </div>
            </div>
            <Footer/>
        </>
    );
}