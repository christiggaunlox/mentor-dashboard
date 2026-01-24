"use client"

import React, { useState } from "react";
import { format, isSameDay } from "date-fns";
import {
    Calendar as CalendarIcon,
    Clock,
    Video,
    MoreVertical,
} from "lucide-react";

// Shadcn UI Components (Adjust import paths based on your project structure)
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Mock Data ---
const scheduledClasses = [
    {
        id: 1,
        topic: "Advanced React Patterns",
        student: "Alice Johnson",
        image: "https://i.pravatar.cc/150?u=alice",
        time: "10:00 AM - 11:00 AM",
        date: new Date(), // Today
        status: "Upcoming",
        type: "1:1 Session"
    },
    {
        id: 2,
        topic: "System Design Basics",
        student: "Mark Smith",
        image: "https://i.pravatar.cc/150?u=mark",
        time: "02:00 PM - 03:00 PM",
        date: new Date(), // Today
        status: "Pending",
        type: "Group Call"
    },
    {
        id: 3,
        topic: "Career Guidance",
        student: "Sarah Lee",
        image: "https://i.pravatar.cc/150?u=sarah",
        time: "04:30 PM - 05:00 PM",
        date: new Date(), // Today
        status: "Confirmed",
        type: "1:1 Session"
    },
    {
        id: 4,
        topic: "Intro to TypeScript",
        student: "David Kim",
        image: "https://i.pravatar.cc/150?u=david",
        time: "09:00 AM - 10:30 AM",
        date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
        status: "Upcoming",
        type: "Workshop"
    }
];

export default function Dashboard() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Filter classes based on the selected date
    const selectedDateClasses = scheduledClasses.filter((session) =>
        date && isSameDay(session.date, date)
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">

            {/* Header Section */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Welcome back! Here is your mentorship schedule.</p>
                </div>
                <div className="hidden md:flex gap-2">
                    <Button variant="outline">Sync Calendar</Button>
                    <Button>+ New Session</Button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid gap-6 md:grid-cols-12 lg:grid-cols-12 h-full">

                {/* LEFT COLUMN: Calendar & Quick Stats */}
                <div className="md:col-span-4 lg:col-span-3 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center p-0 pb-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border shadow-sm"
                            />
                        </CardContent>
                    </Card>

                    {/* Mini Stat Card (Optional but nice) */}
                    <Card className="bg-slate-900 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-800 rounded-full">
                                    <Clock className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Total Hours Today</p>
                                    <p className="text-2xl font-bold">4.5 Hrs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Scheduled Classes List */}
                <div className="md:col-span-8 lg:col-span-9">
                    <Card className="h-full border-none shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">
                                    {date ? (
                                        <span>Schedule for {format(date, "MMMM do, yyyy")}</span>
                                    ) : (
                                        <span>Select a date</span>
                                    )}
                                </CardTitle>
                                <Badge variant="secondary" className="px-3 py-1">
                                    {selectedDateClasses.length} Sessions
                                </Badge>
                            </div>
                            <CardDescription>
                                Manage your upcoming classes and student meetings.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-0">
                            <ScrollArea className="h-[600px] pr-4">
                                {selectedDateClasses.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedDateClasses.map((session) => (
                                            <Card key={session.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
                                                <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">

                                                    {/* Time Column */}
                                                    <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 min-w-[120px]">
                                                        <span className="text-lg font-bold text-slate-700">
                                                            {session.time.split('-')[0]}
                                                        </span>
                                                        <span className="text-sm text-slate-400">
                                                            {session.time.split('-')[1]}
                                                        </span>
                                                    </div>

                                                    {/* Details Column */}
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-lg">{session.topic}</h3>
                                                            <Badge variant={session.status === 'Confirmed' ? 'default' : 'secondary'} className="text-[10px]">
                                                                {session.status}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={session.image} />
                                                                    <AvatarFallback>ST</AvatarFallback>
                                                                </Avatar>
                                                                <span>{session.student}</span>
                                                            </div>
                                                            <Separator orientation="vertical" className="h-4" />
                                                            <div className="flex items-center gap-1">
                                                                <Video className="h-3 w-3" />
                                                                <span>{session.type}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions Column */}
                                                    <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                                        <Button className="w-full sm:w-auto" size="sm">
                                                            Start Class
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    // Empty State
                                    <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-slate-50">
                                        <div className="p-4 bg-slate-100 rounded-full mb-4">
                                            <CalendarIcon className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900">No classes scheduled</h3>
                                        <p className="text-slate-500 max-w-sm text-center mb-6">
                                            You are free for the day! Enjoy your time off or schedule a new session.
                                        </p>
                                        <Button variant="outline">Schedule Session</Button>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}