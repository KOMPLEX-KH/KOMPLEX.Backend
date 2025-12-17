import { Request, Response } from "express";
import { createBook, updateBook, deleteBook, adminGetAllBooks, adminGetBookById } from "../services/library/service.js";

export const createBookController = async(req: Request , res: Response)=>{
    try{

        const result = await createBook(
            req.body.title,
            req.body.author,
            req.body.gradeId,
            req.body.lessonId,
            req.body.isRecommended,
            req.body.subjectId,
            req.body.publishedDate,
            req.body.description,
            req.body.pdfUrl,
            req.body.imageUrl
        );
        res.status(201).json(result);
    }catch(err){
        res.status(500).json({ message: "Failed to create book" });
    }
}

export const updateBookController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await updateBook(String(id), req.body
    );

        if (!result.data) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Failed to update book" });
    }
};

export const deleteBookController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await deleteBook(String(id));

        if (!result.data) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.status(200).json({ message: "Book deleted", data: result.data });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete book" });
    }
};

export const adminGetAllBooksController = async (req: Request, res: Response) => {
    try {
        const result = await adminGetAllBooks();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch books" });
    }
};


export const adminGetBookByIdController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await adminGetBookById(String(id));

        if (!result.data) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch book" });
    }
};

