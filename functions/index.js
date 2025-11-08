const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function para criar um novo usuário com o papel 'admin-escola'.
 * Apenas um 'admin-hyo' autenticado pode chamar esta função.
 */
exports.createAdminEscola = functions.https.onCall(async (data, context) => {
  // 1. Verificação de Autenticação e Autorização
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Você precisa estar autenticado para executar esta operação.",
    );
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection("users").doc(callerUid).get();

  if (!callerDoc.exists || callerDoc.data().role !== "admin-hyo") {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Você não tem permissão para criar administradores de escola.",
    );
  }

  // 2. Validação dos Dados de Entrada
  const { email, password, escolaId } = data;
  if (!email || !password || !escolaId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Email, senha e ID da escola são obrigatórios.",
    );
  }

  try {
    // 3. Criação do Usuário no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    const newUserId = userRecord.uid;
    console.log(`Usuário ${newUserId} (${email}) criado com sucesso.`);

    // 4. Criação do Documento na Coleção 'users'
    await admin.firestore().collection("users").doc(newUserId).set({
      email: email,
      role: "admin-escola",
      escolaId: escolaId,
      profileId: newUserId, // Vincula ao próprio perfil
    });

    // 5. Atualização do Documento na Coleção 'escolas'
    await admin.firestore().collection("escolas").doc(escolaId).update({
      adminResponsavelId: newUserId,
    });

    // 6. Registro da Atividade
    await admin.firestore().collection("activities").add({
        user: context.auth.token.email,
        action: `criou o administrador ${email} para a escola ${escolaId}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      status: "success",
      message: `Administrador ${email} criado e associado à escola ${escolaId}.`,
      userId: newUserId,
    };
  } catch (error) {
    console.error("Erro ao criar admin de escola:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Ocorreu um erro interno ao processar a solicitação.",
        error,
    );
  }
});

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    await admin.firestore().collection("activities").add({
        user: user.email,
        action: "se cadastrou no sistema",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
});
