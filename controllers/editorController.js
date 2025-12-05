import User from '../models/User.js'
import Project from '../models/Project.js'
import File from '../models/File.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

export const saveFile = async (req, res) => {
    try {
        const codeBuffer = Buffer.from(req.body.code, 'utf-8')
        const projectID = req.body.projectID
        const fileName = req.body.name

        const user = await User.findById(req.user._id).populate("projects")


        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        const projects = user.projects || []
        let project = projects.find(p => p._id.toString() === projectID)

        if (!project) {
            return res.status(404).json({ error: "Project not found" })
        }

        console.log(`\nSaving ${fileName} to ${req.user.username}/${project.name}`)

        const fileList = await File.find({ projectId: project._id })
        let file = fileList.find(f => f.fname === fileName)
        console.log(`File: ${file}`)


        if (!file) {
            file = new File({
                projectId: project._id,
                dirPath: user.username + "/" +project.name + "/",
                fname: fileName,
                extension: "txt",
                contents: codeBuffer
            })

            await file.save()
            project.files.push(file._id)
            console.log(`Created new file ${fileName}`)

        } else {
            if (file.contents !== codeBuffer) {
                file.contents = codeBuffer
            }
            await file.save()
            console.log(`File already exists, updated ${fileName}`)
        }

        console.log(file)

        await project.save()
        await user.save()

        console.log("File Saved")
        res.json({ success: true, message: "File saved successfully" })

    } catch (error) {
        console.error("Save file error:", error)
        res.status(500).json({ error: "Server Error" })
    }
}

export const openFile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("projects")

        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        const projects = user.projects || []
        let project = projects.find(p => p._id.toString() === req.query.projectID)

        if (!project) {
            return res.status(404).json({ error: "Project not found" })
        }

        await project.populate("files")
        const fileName = req.params.id

        console.log(`Looking for ${fileName}`)
        console.log(`Files in project: ${project.files}`)

        const file = project.files.find(f => f.fname === fileName)

        if (!file) {
            console.log("File not Found")
            return res.status(404).json({ error: "File not found" })
        }

        console.log(`Found: ${file}`)
        const fileContents = file.contents.toString('utf8')
        console.log(`File contents: ${fileContents}`)

        res.json({
            fileName: file.fname,
            contents: fileContents,
            version: file.version || 0
        })
    } catch (err) {
        console.error("Server Error: ", err)
        res.status(500).json({ error: "Server Error" })
    }
}

export const newProject = async (req, res) => {
    try {
        const projectName = req.body.projectName
        const user = await User.findById(req.user._id).populate("projects")
        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }
        if (!projectName) {
            return res.status(400).json({ message: "Project name is required" })
        }
        const existingProject = user.projects.find(p => p.name === projectName)
        if (existingProject) {
            return res.status(400).json({ message: "Project with this name already exists" })
        }
        else {
            const newProject = new Project({
                name: projectName,
                owner: user._id,
                sharedWith: [],
                dateCreated: new Date(),
                files: []
            })

            console.log("Creating new project...")
            user.projects.push(newProject._id)
            await newProject.save()
            await user.save()
            console.log("Project Created")
            res.json({ success: true, message: "Project created successfully", project: newProject })
        }
    }
    catch (err) {
        console.error("Server Error: ", err)
        res.status(500).json({ error: "Server Error" })
    }
}

export const loadProjects = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: "projects",
            populate: {
                path: "files"
            }
        })
        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }
        res.json({ projects: user.projects })

    } catch (err) {
        console.error("Server Error: ", err)
        res.status(500).json({ error: "Server Error" })
    }
}

export const createFile = async (req, res) => {
    try {
        const { projectID, fileName } = req.body
        const user = await User.findById(req.user._id).populate("projects")

        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        const project = user.projects.find(p => p._id.toString() === projectID)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        await project.populate("files")
        const existingFile = project.files.find(f => f.fname === fileName)

        if (existingFile) {
            return res.status(400).json({ message: "File already exists" })
        }

        const newFile = new File({
            projectId: project._id,
            dirPath: user.username + "/" + projectID + "/",
            fname: fileName,
            extension: fileName.split('.').pop() || "txt",
            contents: Buffer.from("", 'utf-8')
        })

        await newFile.save()
        project.files.push(newFile._id)
        await project.save()

        console.log(`Created file ${fileName} in project ${project.name}`)
        res.json({ success: true, message: "File created successfully", file: newFile })

    } catch (error) {
        console.error("Create file error:", error)
        res.status(500).json({ error: "Server Error" })
    }
}

export const deleteFile = async (req, res) => {
    try {
        const { projectID, fileName } = req.body
        const user = await User.findById(req.user._id).populate("projects")

        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        const project = user.projects.find(p => p._id.toString() === projectID)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        await project.populate("files")
        const file = project.files.find(f => f.fname === fileName)

        if (!file) {
            return res.status(404).json({ message: "File not found" })
        }

        // Remove file from database
        await File.findByIdAndDelete(file._id)

        // Remove file reference from project
        project.files = project.files.filter(f => f._id.toString() !== file._id.toString())
        await project.save()

        console.log(`Deleted file ${fileName} from project ${project.name}`)
        res.json({ success: true, message: "File deleted successfully" })

    } catch (error) {
        console.error("Delete file error:", error)
        res.status(500).json({ error: "Server Error" })
    }
}

export const deleteProject = async (req, res) => {
    try {
        const { projectID } = req.body
        const user = await User.findById(req.user._id).populate("projects")

        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        const project = user.projects.find(p => p._id.toString() === projectID)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        // Delete all files in the project
        await File.deleteMany({ projectId: project._id })

        // Remove project from user's projects
        user.projects = user.projects.filter(p => p._id.toString() !== project._id.toString())
        await user.save()

        // Delete the project itself
        await Project.findByIdAndDelete(project._id)

        console.log(`Deleted project ${project.name} and all its files`)
        res.json({ success: true, message: "Project deleted successfully" })

    } catch (error) {
        console.error("Delete project error:", error)
        res.status(500).json({ error: "Server Error" })
    }
}

export const loadSharedSession = (req, res) => {
    const { roomID, projectID } = req.params
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const pagesDirectory = path.join(__dirname, '..', 'frontend', 'pages')
    try {

        const filePath = path.join(pagesDirectory, 'editor.html')

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).send('Error loading page')
            }

            const username = req.user?.username || 'Anonymous'
            const modifiedHtml = data.replace(
                '</head>',
                `    <meta name="username" content="${username}">\n
                     <meta name="roomID" content="${roomID}">\n
                     <meta name="projectID" content="${projectID}">\n</head>`
            )

            res.send(modifiedHtml)
        })
    }
    catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export const loadSharedProject = async (req, res) => {
    const projectID = req.params.projectID
    try {
        const sharedProject = await Project.findById(projectID).populate("files")
        if (!sharedProject) {
            return res.status(404).json({ message: "Project not found" })
        }
        // Convert buffers to strings
        const projectWithContents = sharedProject.toObject()
        projectWithContents.files = projectWithContents.files.map(file => ({
            _id: file._id,
            fname: file.fname,
            contents: file.contents ? file.contents.toString('utf8') : '',
            shared: true
        }))
        res.json({ projects: [projectWithContents] })
    } catch (err) {
        console.error("Server Error: ", err)
        res.status(500).json({ error: "Server Error" })
    }
}