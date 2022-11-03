/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/ global getAssetRegistry getFactory emit /

async function checkUserExists(userRegistry, userHId) {
    try {
        //check if user Exists in the registry
        const userExists = await userRegistry.exists(userHId);
        return (userExists);
    }
    catch (e) {
        throw new Error(e);
    }
}

async function checkVerifierExists(verifierRegistry, verifierHId) {
    try {
        //check of the verifier exists or not
        const verifierExists = await verifierRegistry.exists(verifierHId);
        return (verifierExists);
    }
    catch (e) {
        throw new Error(e);
    }
}

async function checkDocumentExists(documentRegistry, documentId) {
    try {
        //check if the document exists in the registry
        const documentExists = await documentRegistry.exists(documentId);
        return (documentExists);
    }
    catch (e) {
        throw new Error(e);
    }
}

/**
 * Sample transaction processor function.
 * @param {org.example.akcess.addDocument} tx The sample transaction instance.
 * @transaction
 */

async function addDocument(tx) {  // eslint-disable-line no-unused-vars
    try {
        //get the current participant
        let currentUser = getCurrentParticipant();
        //get the User and Document registry
        const UserRegistry = await getParticipantRegistry('org.example.akcess.User');
        const DocumentRegistry = await getAssetRegistry('org.example.akcess.Document');
        //check if the user exists in the registry
        let userExists = await checkUserExists(UserRegistry, tx.document.User.userHId);
        if (userExists) {
            if (tx.document.User.getFullyQualifiedIdentitfier == currentUser.getFullyQualifiedIdentitfier) {
                //check if documentId already exists
                let documentExists = await checkDocumentExists(DocumentRegistry, tx.document.documentId);
                if (documentExists) {
                    throw new Error('Document Id already exists');
                }
                else {
                    //create a new instance of the document asset
                    let factory = getFactory();
                    let file = await factory.newResource('org.example.akcess', 'Document', tx.document.documentId);
                    file = tx.document;
                    //let the currentParticipant be the asset creator itself
                    file.User = tx.document.User;
                    file.checkIfVerified = "UNVERIFIED";
                    //add the asset to the asset registry
                    await DocumentRegistry.add(file);
                }
            }
            else {
                throw new Error('Invalid Access')
            }
        }
        else {
            throw new Error('User does not exists');
        }
    }
    catch (e) {
        throw new Error(e);
    }
}


/**
 * Sample transaction processor function.
 * @param {org.example.akcess.verifyDocument} tx The sample transaction instance.
 * @transaction
 */

async function verifyDocument(tx) {  // eslint-disable-line no-unused-vars
    try {
        //get the current particicpant
        let currentUser = getCurrentParticipant();
        //get the participant and asset registry
        const VerifierRegistry = await getParticipantRegistry('org.example.akcess.Verifier');
        const DocumentRegistry = await getAssetRegistry('org.example.akcess.Document');
        //check if verfier and document in the registry
        let verifierExists = await checkVerifierExists(VerifierRegistry, tx.verifier.verifierHId)
        let documentExists = await checkDocumentExists(DocumentRegistry, tx.document.documentId);
        if (verifierExists) {
            if (documentExists) {
                if (currentUser.getFullyQualifiedIdentitfier == tx.verifier.getFullyQualifiedIdentitfier){
                  if(tx.document.hash == tx.odocument.hash){
                    //input the argument in the VERIFICATION SECTION
                    tx.document.checkIfVerified = tx.checkIfVerified;
                    tx.document.VerifierHId = tx.verifier.verifierHId;
                    tx.document.checkIfVerified = 'APPROVED';
                    //update the documentRegistry
                    await DocumentRegistry.update(tx.document);
                   }
                  else{
                    throw new Error('The hash of original document do not match with the uploaded document');
                  }
                }
                else {
                    throw new Error('Invalid Access');
                }
            }
            else {
                throw new Error('Document does not exists');
            }
        }
        else {
            throw new Error('Verifier Id doesnot exists');
        }
    }
    catch (e) {
        throw new Error(e);
    }
}