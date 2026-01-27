"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import * as React from "react";
import AddCurriculum from "./AddCurriculum";
import ViewCurriculum from "./ViewCurriculum";

export default function page() {
    const [activeTab, setActiveTab] = React.useState("add");

    return (
        <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full overflow-x-auto flex-nowrap whitespace-nowrap gap-2 p-1">
                    <TabsTrigger className="cursor-pointer" value="add">Add Curriculum</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="view">View Your Curriculums</TabsTrigger>
                </TabsList>

                <TabsContent value="add" className="flex-shrink-0 cursor-pointer">
                    <AddCurriculum />
                </TabsContent>

                <TabsContent value="view" className="flex-shrink-0 cursor-pointer">
                    <ViewCurriculum />
                </TabsContent>
            </Tabs>
        </div>
    )
};