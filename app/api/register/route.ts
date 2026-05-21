import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, email, password, dateOfBirth } = await req.json();

    if (!username || !email || !password || !dateOfBirth) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // Verificar edad mínima (12 años)
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 12) {
      return NextResponse.json({ error: 'Debes tener al menos 12 años para registrarte' }, { status: 400 });
    }

    // Comprobar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El nombre de usuario o email ya está en uso' },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        dateOfBirth: new Date(dateOfBirth),
      },
    });

    // No devolver la contraseña en la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error in register:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
