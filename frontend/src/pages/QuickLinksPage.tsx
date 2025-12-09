import React from 'react';
import QuickLinks from '../components/QuickLinks';

const QuickLinksPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-20 md:pb-0 pt-0 md:pt-16">
            <div className="max-w-4xl mx-auto w-full p-4 md:p-6">
                <div className="bg-white dark:bg-dark-paper rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">
                        Quick Links
                    </h1>
                    <QuickLinks />
                </div>
            </div>
        </div>
    );
};

export default QuickLinksPage;

