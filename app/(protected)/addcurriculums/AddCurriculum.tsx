"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { toast } from "react-toastify"

type CourseOption = {
    _id: string
    name: string
}

export default function AddCurriculum() {
    const [courses, setCourses] = useState<CourseOption[]>([])
    const [courseId, setCourseId] = useState("")
    const [topics, setTopics] = useState<string[]>([""])

    const hasDuplicateTopics = (topics: string[]) => {
        const normalized = topics.map(t => t.trim().toLowerCase())
        return new Set(normalized).size !== normalized.length
    }


    useEffect(() => {
        const fetchCourses = async () => {

            try {
                const token = localStorage.getItem("mentorAccessToken")

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/mentor/courses`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )

                const data = await res.json()
                setCourses(data.data || [])
            } catch {
                toast.error("Failed to load courses")
            }
        }

        fetchCourses()
    }, [])

    /* ---------------- TOPICS ---------------- */
    const addTopic = () => setTopics([...topics, ""])
    const removeTopic = (index: number) =>
        setTopics(topics.filter((_, i) => i !== index))

    const updateTopic = (index: number, value: string) => {
        const updated = [...topics]
        updated[index] = value
        setTopics(updated)
    }

    const handleSubmit = async () => {
        if (!courseId) {
            toast.warning("Please select a course before continuing")
            return
        }

        const filteredTopics = topics
            .map(t => t.trim())
            .filter(Boolean)

        if (filteredTopics.length === 0) {
            toast.warning("Please add at least one topic")
            return
        }

        if (filteredTopics.length !== topics.length) {
            toast.warning("Please fill all topic fields or remove empty ones")
            return
        }

        // 🔥 DUPLICATE CHECK (NEW)
        if (hasDuplicateTopics(filteredTopics)) {
            toast.error("Topic names must be unique")
            return
        }

        try {
            const token = localStorage.getItem("mentorAccessToken")
            if (!token) {
                toast.error("Session expired. Please log in again")
                return
            }

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/course/createcurriculum`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        courseId,
                        topics: filteredTopics,
                    }),
                }
            )

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.message || "Unable to save curriculum")
                return
            }

            toast.success("Curriculum created successfully 🎉")
            setCourseId("")
            setTopics([""])

        } catch (error) {
            toast.error("Network error. Please try again")
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 p-6">
            <Card className="max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle>Add Curriculum</CardTitle>
                    <CardDescription>
                        Add topics under your assigned courses
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* COURSE SELECT */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Course</label>
                        <Select value={courseId} onValueChange={setCourseId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((course) => (
                                    <SelectItem key={course._id} value={course._id}>
                                        {course.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* TOPICS */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Topics</label>

                        {topics.map((topic, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    placeholder={`Topic ${index + 1}`}
                                    value={topic}
                                    onChange={(e) =>
                                        updateTopic(index, e.target.value)
                                    }
                                />
                                {topics.length > 1 && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => removeTopic(index)}
                                    >
                                        ✕
                                    </Button>
                                )}
                            </div>
                        ))}

                        <Button variant="outline" onClick={addTopic}>
                            + Add Topic
                        </Button>
                    </div>

                    <Button className="w-full" onClick={handleSubmit}>
                        Save Curriculum
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
