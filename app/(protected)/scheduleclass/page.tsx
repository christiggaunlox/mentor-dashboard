"use client"

import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Topic {
    _id: string;
    name: string;
}

const ScheduleClasses = () => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(true);

    // Form State
    const [selectedTopic, setSelectedTopic] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string>("12:00");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("mentorAccessToken")

        fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/mentor/gettopics`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        )
            .then(res => res.json())
            .then(data => {
                setTopics(data.topics);
                setLoadingTopics(false);
            })
            .catch(err => console.error("Error fetching topics:", err));
    }, []);

    const handleSubmit = async () => {
        if (!selectedTopic || !selectedDate) {
            alert("Please select both a topic and a date.");
            return;
        }

        setIsSubmitting(true);

        // Combine Date and Time
        const [hours, minutes] = selectedTime.split(':');
        const finalSchedule = new Date(selectedDate);
        finalSchedule.setHours(parseInt(hours), parseInt(minutes));

        try {
            const response = await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: selectedTopic,
                    schedule: finalSchedule,
                    mentorId: '65a...bc1', // Replace with your logic
                }),
            });

            if (response.ok) {
                alert("Class scheduled!");
                setSelectedTopic("");
                setSelectedDate(undefined);
            }
        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 border rounded-xl bg-white shadow-sm mt-10 space-y-6">
            <h2 className="text-xl font-semibold">Schedule a Class</h2>

            {/* Topic Selection */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Topic</label>
                <Select onValueChange={setSelectedTopic} value={selectedTopic}>
                    <SelectTrigger>
                        <SelectValue placeholder={loadingTopics ? "Loading..." : "Choose a topic"} />
                    </SelectTrigger>
                    <SelectContent>
                        {topics.map((t) => (
                            <SelectItem key={t._id} value={t.name}>
                                {t.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Date & Time Selection */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Date & Time</label>
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "flex-1 justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="flex h-10 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={isSubmitting}
            >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Schedule Class"}
            </Button>
        </div>
    );
};

export default ScheduleClasses;